from aws_cdk import (
    aws_ec2 as ec2,
    aws_servicediscovery as servicediscovery,
    Tags,
)
from constructs import Construct


class NetworkConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_name: str):
        super().__init__(scope, id)

        # Create VPC with only public subnets (no NAT gateways needed)
        self.vpc = ec2.Vpc(
            self,
            f"CapVpc-{environment_name}",
            max_azs=2,  # ALB requires at least 2 AZs
            nat_gateways=0,  # No NAT gateways - use public IPs instead
            ip_addresses=ec2.IpAddresses.cidr(
                "172.16.0.0/16"
            ),  # Use different CIDR range
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"EDP-{environment_name}-PublicSubnets",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=25,  # Changed from 24 to avoid CIDR conflicts
                ),
            ],
        )

        # Add specific tags to VPC
        Tags.of(self.vpc).add("ResourceType", "vpc")
        Tags.of(self.vpc).add("Purpose", "application-networking")

        self.ecs_sg = ec2.SecurityGroup(self, f"{environment_name}-EcsSG", vpc=self.vpc)

        # Add specific tags to security group
        Tags.of(self.ecs_sg).add("ResourceType", "security-group")
        Tags.of(self.ecs_sg).add("Purpose", "ecs-traffic-control")

        # Create Cloud Map namespace for service discovery (internal services)
        self.service_discovery_namespace = servicediscovery.PrivateDnsNamespace(
            self,
            "ServiceDiscoveryNamespace",
            name=f"perseus-cap-{environment_name}.local",
            vpc=self.vpc,
            description=f"Service discovery namespace for {environment_name} environment",
        )

        Tags.of(self.service_discovery_namespace).add("ResourceType", "service-discovery-namespace")
        Tags.of(self.service_discovery_namespace).add("Purpose", "internal-service-discovery")
