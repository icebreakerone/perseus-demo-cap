from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecs as ecs,
    Tags,
)
from constructs import Construct


class SharedEcsCluster(Construct):
    """Shared ECS cluster for all services in the stack."""

    def __init__(
        self, scope: Construct, id: str, vpc: ec2.Vpc, environment_name: str, **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        # Create shared ECS Cluster
        self.cluster = ecs.Cluster(
            self,
            "SharedEcsCluster",
            vpc=vpc,
            cluster_name=f"perseus-cap-{environment_name}-cluster",
        )
