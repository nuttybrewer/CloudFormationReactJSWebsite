#!/bin/bash -f
if [[ -f .deploy.env ]];then
  source .deploy.env
fi
aws_access_key_id=`cat ~/.aws/credentials | grep aws_access_key_id | cut -d'=' -f2 | sed 's/[^0-9A-Z]*//g'`
aws_secret_access_key=`cat ~/.aws/credentials | grep aws_secret_access_key | cut -d'=' -f2`
export AWS_ACCESS_KEY_ID=$aws_access_key_id;
export AWS_SECRET_ACCESS_KEY=$aws_secret_access_key;

circleci config process .circleci/config.yml> .civ2
circleci build -c .civ2 --repo-url ./ \
-e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
-e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
-e AWS_DEFAULT_REGION="us-east-1"
# -e LAMBDA_S3_BUCKET_NAME=$LAMBDA_S3_BUCKET_NAME \
# -e LAMBDA_FUNCTION_NAME=$LAMBDA_FUNCTION_NAME \
# -e LAMBDA_S3_PREFIX=$LAMBDA_S3_PREFIX \
# -e ROUTE53_DOMAIN_NAME=$ROUTE53_DOMAIN_NAME \
# -e CLOUDFRONT_SITE_NAME=$CLOUDFRONT_SITE_NAME
rm .civ2
