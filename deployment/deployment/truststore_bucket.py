import os
from aws_cdk import (
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct


class TruststoreBucket(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_name: str,
        truststore_file_path: str,
    ):
        super().__init__(scope, id)

        self.bucket = s3.Bucket(
            self,
            "TruststoreBucket",
            bucket_name=f"perseus-cap-truststore-{environment_name}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        truststore_dir = os.path.dirname(truststore_file_path)
        truststore_filename = os.path.basename(truststore_file_path)

        self.bucket_deployment = s3_deployment.BucketDeployment(
            self,
            "TruststoreDeployment",
            sources=[s3_deployment.Source.asset(truststore_dir)],
            destination_bucket=self.bucket,
            destination_key_prefix="",
            exclude=["*"],
            include=[truststore_filename],
        )

        self.truststore_key = truststore_filename

        CfnOutput(
            self,
            "TruststoreBucketName",
            value=self.bucket.bucket_name,
            description="Truststore Bucket Name",
        )
