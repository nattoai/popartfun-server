# Configuration Directory

This directory contains sensitive configuration files that are **NOT** committed to version control.

## GCP Directory (`gcp/`)

Place your Google Cloud Platform service account key file here:

```
config/gcp/service-account-key.json
```

### How to obtain the service account key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to IAM & Admin > Service Accounts
3. Find your service account (or create one)
4. Click on the service account
5. Go to the "Keys" tab
6. Click "Add Key" > "Create New Key"
7. Select "JSON" format
8. Download and save as `service-account-key.json` in this directory

### Required Permissions:

Your service account should have the following roles:

- **Storage Object Admin** (for the specific bucket)
- Or **Storage Admin** (if you need broader permissions)

### Security Notes:

- ✅ This directory is automatically ignored by Git
- ✅ Never commit service account keys to version control
- ✅ Use environment-specific keys for different deployments
- ✅ Rotate keys regularly for security

### Environment Variables:

Update your `.env` file with:

```env
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-gcp-project-id
GCS_KEY_FILENAME=./config/gcp/service-account-key.json
```

sudo lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9
sudo lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
