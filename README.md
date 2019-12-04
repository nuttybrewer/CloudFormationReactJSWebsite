# CloudFormationReactJSWebsite
ReactJS SPA website

Root contains the CRA app.
mockproxy/ contains the JWT token application to mock OAuth authentication when in development mode.
.circleci/config.yaml contains the deployment steps.

## Deployment steps
To deploy this function, define a *.deploy.env* file in the root directory
and export the following environment variables:
```bash
export "REACT_S3_BUCKET_NAME=<S3 bucket where compiled JS files are to be uploaded>";
export "REACT_S3_PREFIX=<S3 Prefix in the bucket where the files are to be uploaded>";
export "CLOUDFRONT_DISTRIBUTION_ID=<CloudFront ID that hosts the web site>";
```

In order to deploy, install docker from https://www.docker.com/products/docker-desktop.

Then install CircleCI CLI from https://circleci.com/docs/2.0/local-cli-getting-started/#section=getting-started

Once the *.deploy.env* is defined, simply run the **localci.sh** file using
bash to deploy and redeploy.

This simply uploads the compiled website to S3 and then creates an invalidation on CloudFront so that the old files
expire and new ones are loaded into the CDN cache.
