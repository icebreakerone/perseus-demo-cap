from aws_cdk import (
    aws_elasticloadbalancingv2 as elbv2,
    aws_ec2 as ec2,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_certificatemanager as acm,
)
from constructs import Construct


class MtlsAlb(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        vpc: ec2.Vpc,
        trust_store: elbv2.CfnTrustStore,
        certificate: acm.ICertificate,
        mtls_domain: str,
        hosted_zone_name: str,
    ):
        super().__init__(scope, id)

        # Security group for the mTLS ALB
        self.alb_sg = ec2.SecurityGroup(self, "MtlsAlbSG", vpc=vpc)
        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "Allow HTTPS traffic"
        )

        # mTLS ALB
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            "MtlsAlb",
            vpc=vpc,
            internet_facing=True,
            security_group=self.alb_sg,
        )

        # Target group for Fargate service (IP targets, port 3000)
        self.target_group = elbv2.ApplicationTargetGroup(
            self,
            "MtlsTargetGroup",
            vpc=vpc,
            target_type=elbv2.TargetType.IP,
            port=3000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            health_check=elbv2.HealthCheck(path="/"),
        )

        # HTTPS listener with mTLS verification
        self.listener = elbv2.CfnListener(
            self,
            "MtlsHttpsListener",
            certificates=[{"certificateArn": certificate.certificate_arn}],
            default_actions=[
                {
                    "type": "forward",
                    "targetGroupArn": self.target_group.target_group_arn,
                }
            ],
            load_balancer_arn=self.alb.load_balancer_arn,
            port=443,
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
            mutual_authentication={
                "mode": "verify",
                "trustStoreArn": trust_store.attr_trust_store_arn,
            },
        )

        # Route53 DNS record
        hosted_zone = route53.HostedZone.from_lookup(
            self, "HostedZone", domain_name=hosted_zone_name
        )

        route53.ARecord(
            self,
            "MtlsAlbAliasRecord",
            zone=hosted_zone,
            record_name=mtls_domain,
            target=route53.RecordTarget.from_alias(
                targets.LoadBalancerTarget(self.alb)
            ),
        )
