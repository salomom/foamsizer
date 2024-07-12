import { PutObjectCommand , S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


export async function uploadImage(event, filePath) {
  const fileName = path.basename(filePath)
  const params = {
    Bucket: 'toolsimages',
    Key: fileName,
    Body: fs.createReadStream(filePath),
    ContentType: 'image/png',
  };
  const command = new PutObjectCommand(params);
  const data = await s3.send(command);
  if(data['$metadata']['httpStatusCode'] === 200) {
    return true;
  } else {
    console.error(data)
    return false;
  }
}
