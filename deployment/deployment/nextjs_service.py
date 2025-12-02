from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_iam as iam,
    aws_ecr_assets as ecr_assets,
    aws_ecs_patterns as ecs_patterns,
    aws_certificatemanager as acm,
    aws_route53 as route53,
    Tags,
)
from constructs import Construct


class NextJsService(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        cluster: ecs.Cluster,
        vpc: ec2.Vpc,
        secrets_policy: iam.ManagedPolicy,
        environment: dict,
        ecs_sg: ec2.SecurityGroup,
        certificate: acm.ICertificate,
        domain_name: str,
        domain_zone_name: str,
        env_name: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        # Define the Fargate service with ALB
        fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            "CapNextJsAppService",
            cluster=cluster,
            cpu=256,
            memory_limit_mib=512,
            desired_count=1,
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_asset(
                    "../",
                    platform=ecr_assets.Platform.LINUX_AMD64,
                    build_args={"ENV": env_name},
                ),
                container_port=3000,
                environment=environment,
            ),
            public_load_balancer=True,
            assign_public_ip=True,
            security_groups=[ecs_sg],
            enable_execute_command=True,
            domain_name=domain_name,
            domain_zone=route53.HostedZone.from_lookup(
                self, "DomainZone", domain_name=domain_zone_name
            ),
            certificate=certificate,
        )

        # Configure health check path
        fargate_service.target_group.configure_health_check(path="/")
        fargate_service.task_definition.task_role.add_managed_policy(secrets_policy)
