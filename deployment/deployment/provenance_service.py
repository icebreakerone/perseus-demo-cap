from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_iam as iam,
    aws_kms as kms,
    aws_s3 as s3,
    aws_servicediscovery as servicediscovery,
    Tags,
)
from constructs import Construct


class ProvenanceService(Construct):
    """Internal-only provenance service accessible via ECS service discovery."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        cluster: ecs.ICluster,
        vpc: ec2.Vpc,
        kms_key: kms.IKey,
        certificates_bucket: s3.IBucket,
        provenance_service_policy: iam.ManagedPolicy,
        ecs_sg: ec2.SecurityGroup,
        environment_name: str,
        service_discovery_namespace: servicediscovery.INamespace,
        **kwargs,
    ):
        super().__init__(scope, id, **kwargs)

        # Build environment variables
        environment = {
            "ROOT_CA_CERTIFICATE": f"s3://{certificates_bucket.bucket_name}/root-ca.pem",
            "SIGNING_BUNDLE": f"s3://{certificates_bucket.bucket_name}/signing-bundle.pem",
            "KMS_KEY_ID": kms_key.key_id,
            "SCHEME_URI": "https://registry.core.sandbox.trust.ib1.org/scheme/perseus",
            "TRUST_FRAMEWORK_URL": "https://registry.core.sandbox.trust.ib1.org/trust-framework",
        }

        # Create task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            "ProvenanceTaskDefinition",
            cpu=256,
            memory_limit_mib=512,
        )

        # Add container to task definition
        container = task_definition.add_container(
            "ProvenanceContainer",
            image=ecs.ContainerImage.from_registry(
                "public.ecr.aws/q9k4j5t2/ib1/provenance-service:latest"
            ),
            environment=environment,
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="provenance-service",
            ),
        )

        container.add_port_mappings(
            ecs.PortMapping(
                container_port=8080,
                protocol=ecs.Protocol.TCP,
            )
        )

        # Attach the provenance service policy to the task role
        task_definition.task_role.add_managed_policy(provenance_service_policy)

        # Create Fargate service (internal-only, no public access)
        fargate_service = ecs.FargateService(
            self,
            "ProvenanceService",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=1,
            security_groups=[ecs_sg],
            assign_public_ip=True,  # Needed for public subnets without NAT
            enable_execute_command=True,
            # Enable service discovery
            cloud_map_options=ecs.CloudMapOptions(
                name="provenance-service",
                cloud_map_namespace=service_discovery_namespace,
                container=container,
                container_port=8080,
            ),
        )
        # Store references for potential exports
        self.service = fargate_service
        self.cluster = cluster
        self.service_discovery_name = (
            f"provenance-service.{service_discovery_namespace.namespace_name}"
        )
