from aws_cdk import (
    aws_elasticloadbalancingv2 as elbv2,
    aws_s3_deployment as s3_deployment,
    CfnOutput,
)
from constructs import Construct


class Truststore(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_name: str,
        bucket_name: str,
        truststore_key: str,
        bucket_deployment: s3_deployment.BucketDeployment,
    ):
        super().__init__(scope, id)

        self.trust_store = elbv2.CfnTrustStore(
            self,
            "TrustStore",
            name=f"PerseusCapTrust-{environment_name}",
            ca_certificates_bundle_s3_bucket=bucket_name,
            ca_certificates_bundle_s3_key=truststore_key,
        )

        # Ensure the CA bundle is uploaded before the trust store is created
        self.trust_store.node.add_dependency(bucket_deployment)

        CfnOutput(
            self,
            "TrustStoreArn",
            value=self.trust_store.attr_trust_store_arn,
            description="ELB Trust Store ARN",
        )
