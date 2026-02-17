from aws_cdk import (
    aws_elasticloadbalancingv2 as elbv2,
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
    ):
        super().__init__(scope, id)

        self.trust_store = elbv2.CfnTrustStore(
            self,
            "TrustStore",
            name=f"PerseusCapTrust-{environment_name}",
            ca_certificates_bundle_s3_bucket=bucket_name,
            ca_certificates_bundle_s3_key=truststore_key,
        )

        CfnOutput(
            self,
            "TrustStoreArn",
            value=self.trust_store.attr_trust_store_arn,
            description="ELB Trust Store ARN",
        )
