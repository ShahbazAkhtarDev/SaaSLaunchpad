import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import readline from 'node:readline';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';

const execAsync = promisify(exec);

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function checkStripeCLI() {
  console.log(
    'Step 1: Checking if Stripe CLI is installed and authenticated...'
  );
  try {
    await execAsync('stripe --version');
    console.log('Stripe CLI is installed.');

    // Check if Stripe CLI is authenticated
    try {
      await execAsync('stripe config --list');
      console.log('Stripe CLI is authenticated.');
    } catch (error) {
      console.log(
        'Stripe CLI is not authenticated or the authentication has expired.'
      );
      console.log('Please run: stripe login');
      const answer = await question(
        'Have you completed the authentication? (y/n): '
      );
      if (answer.toLowerCase() !== 'y') {
        console.log(
          'Please authenticate with Stripe CLI and run this script again.'
        );
        process.exit(1);
      }

      // Verify authentication after user confirms login
      try {
        await execAsync('stripe config --list');
        console.log('Stripe CLI authentication confirmed.');
      } catch (error) {
        console.error(
          'Failed to verify Stripe CLI authentication. Please try again.'
        );
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(
      'Stripe CLI is not installed. Please install it and try again.'
    );
    console.log('To install Stripe CLI, follow these steps:');
    console.log('1. Visit: https://docs.stripe.com/stripe-cli');
    console.log(
      '2. Download and install the Stripe CLI for your operating system'
    );
    console.log('3. After installation, run: stripe login');
    console.log(
      'After installation and authentication, please run this setup script again.'
    );
    process.exit(1);
  }
}

async function getPostgresURL(): Promise<string> {
  console.log('Step 2: Setting up Postgres');
  const dbChoice = await question(
    'Do you want to use a local Postgres instance with Docker (L) or a remote Postgres instance (R)? (L/R): '
  );

  if (dbChoice.toLowerCase() === 'l') {
    console.log('Setting up local Postgres instance with Docker...');
    await setupLocalPostgres();
    return 'postgres://postgres:postgres@localhost:54322/postgres';
  } else {
    console.log(
      'You can find Postgres databases at: https://vercel.com/marketplace?category=databases'
    );
    return await question('Enter your POSTGRES_URL: ');
  }
}

async function setupLocalPostgres() {
  console.log('Checking if Docker is installed...');
  try {
    await execAsync('docker --version');
    console.log('Docker is installed.');
  } catch (error) {
    console.error(
      'Docker is not installed. Please install Docker and try again.'
    );
    console.log(
      'To install Docker, visit: https://docs.docker.com/get-docker/'
    );
    process.exit(1);
  }

  console.log('Creating docker-compose.yml file...');
  const dockerComposeContent = `
services:
  postgres:
    image: postgres:16.4-alpine
    container_name: next_saas_starter_postgres
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "54322:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`;

  await fs.writeFile(
    path.join(process.cwd(), 'docker-compose.yml'),
    dockerComposeContent
  );
  console.log('docker-compose.yml file created.');

  console.log('Starting Docker container with `docker compose up -d`...');
  try {
    await execAsync('docker compose up -d');
    console.log('Docker container started successfully.');
  } catch (error) {
    console.error(
      'Failed to start Docker container. Please check your Docker installation and try again.'
    );
    process.exit(1);
  }
}

async function getStripeSecretKey(): Promise<string> {
  console.log('Step 3: Getting Stripe Secret Key');
  console.log(
    'You can find your Stripe Secret Key at: https://dashboard.stripe.com/test/apikeys'
  );
  return await question('Enter your Stripe Secret Key: ');
}

async function createStripeWebhook(): Promise<string> {
  console.log('Step 4: Creating Stripe webhook...');
  try {
    const { stdout } = await execAsync('stripe listen --print-secret');
    const match = stdout.match(/whsec_[a-zA-Z0-9]+/);
    if (!match) {
      throw new Error('Failed to extract Stripe webhook secret');
    }
    console.log('Stripe webhook created.');
    return match[0];
  } catch (error) {
    console.error(
      'Failed to create Stripe webhook. Check your Stripe CLI installation and permissions.'
    );
    if (os.platform() === 'win32') {
      console.log(
        'Note: On Windows, you may need to run this script as an administrator.'
      );
    }
    throw error;
  }
}

function generateAuthSecret(): string {
  console.log('Step 5: Generating AUTH_SECRET...');
  return crypto.randomBytes(32).toString('hex');
}

async function setupPushNotifications() {
  console.log('Step 6: Configuring Push Notifications');
  const configurePushNotifications = await question('Do you want to configure push notifications? (y/n): ');
  if (configurePushNotifications.toLowerCase() !== 'y') {
    return {};
  }
  const pushNotificationsChannel = await getPushNotificationsChannel();
  let pushNotificationsConfig = {};
  if (pushNotificationsChannel == 'firebase') {
    pushNotificationsConfig = await getFirebaseConfig();
  } else if (pushNotificationsChannel == 'onesignal') {
    pushNotificationsConfig = await getOneSignalConfig();
  }
  return {
    NEXT_PUBLIC_PUSH_NOTIFICATIONS_CHANNEL: pushNotificationsChannel,
    ...pushNotificationsConfig,
  };
}

async function getFirebaseConfig() {
  console.log('Step 6.1: Configuring Firebase');
  const firebaseConfig = {
    NEXT_PUBLIC_FIREBASE_API_KEY: await question('Enter your Firebase API Key: '),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: await question('Enter your Firebase Auth Domain: '),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: await question('Enter your Firebase Project ID: '),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: await question('Enter your Firebase Storage Bucket: '),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: await question('Enter your Firebase Messaging Sender ID: '),
    NEXT_PUBLIC_FIREBASE_APP_ID: await question('Enter your Firebase App ID: '),
    FIREBASE_MEASUREMENT_ID: await question('Enter your Firebase Measurement ID: '),
    NEXT_PUBLIC_FIREBASE_VAPID: await question('Enter your Firebase VAPID Key: '),
    FIREBASE_ADMIN_PROJECT_ID: await question('Enter your Firebase Admin Project ID: '),
    FIREBASE_ADMIN_PRIVATE_KEY: await question('Enter your Firebase Admin Private Key: '),
    FIREBASE_ADMIN_CLIENT_EMAIL: await question('Enter your Firebase Admin Client Email: '),
  };
  return firebaseConfig;
}
async function getOneSignalConfig() {
  console.log('Step 6.1: Configuring OneSignal');
  const oneSignalConfig = {
    NEXT_PUBLIC_ONESIGNAL_APP_ID: await question('Enter your OneSignal App ID: '),
    ONESIGNAL_REST_API_KEY: await question('Enter your OneSignal REST API Key: '),
  };
  return oneSignalConfig;
}

async function getPushNotificationsChannel() {
  const pushNotificationsChannel = await question('Enter the push notifications channel (firebase/onesignal): ');
  if (pushNotificationsChannel.toLowerCase() !== 'firebase' &&
    pushNotificationsChannel.toLowerCase() !== 'onesignal'
  ) {
    console.error('Invalid push notifications channel. Please enter either "firebase" or "onesignal".');
    return getPushNotificationsChannel();
  }
  return pushNotificationsChannel;
}

async function setupNextAuth(baseURL: string) {
  console.log('Step 7: Configuring NextAuth');
  const configureNextAuth = await question('Do you want to configure NextAuth? (y/n): ');
  if (configureNextAuth.toLowerCase() !== 'y') {
    return {};
  }

  let nextAuthConfig = {
    NEXTAUTH_URL: baseURL,
    NEXTAUTH_SECRET: generateAuthSecret(),
    NEXT_PUBLIC_LOGIN_URL: baseURL + '/auth/signin',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    EMAIL_SERVER_USER: '',
    EMAIL_SERVER_PASSWORD: '',
    EMAIL_SERVER_HOST: '',
    EMAIL_SERVER_PORT: '',
    EMAIL_FROM: '',
  };

  const configureGoogle = await question('Do you want to configure Google for social login? (y/n): ');
  if(configureGoogle.toLowerCase() === 'y') {
    nextAuthConfig = {
      ...nextAuthConfig,
      GOOGLE_CLIENT_ID: await question('Enter your Google Client ID: '),
      GOOGLE_CLIENT_SECRET: await question('Enter your Google Client Secret: '),
    };
  }

  const configureEmail = await question('Do you want to configure Email for Notifications and Email login? (y/n): ');
  if(configureEmail.toLowerCase() === 'y') {
    nextAuthConfig = {
      ...nextAuthConfig,
      EMAIL_SERVER_USER: await question('Enter your Email Server User: '),
      EMAIL_SERVER_PASSWORD: await question('Enter your Email Server Password: '),
      EMAIL_SERVER_HOST: await question('Enter your Email Server Host: '),
      EMAIL_SERVER_PORT: await question('Enter your Email Server Port: '),
      EMAIL_FROM: await question('Enter your Email From: '),
    };
  }
  return nextAuthConfig;
}

async function writeEnvFile(envVars: Record<string, string>) {
  console.log('Step 8: Writing environment variables to .env');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  console.log('.env file created with the necessary variables.');
}


async function main() {
  await checkStripeCLI();

  const APP_NAME = 'SaasLaunchpad Next Starter';
  const BASE_URL = 'http://localhost:3000';
  const APP_LOGO = '';
  const POSTGRES_URL = await getPostgresURL();
  const STRIPE_SECRET_KEY = await getStripeSecretKey();
  const STRIPE_WEBHOOK_SECRET = await createStripeWebhook();
  const AUTH_SECRET = generateAuthSecret();
  const pushNotificationsConfig = await setupPushNotifications();
  const nextAuthConfig = await setupNextAuth(BASE_URL);

  await writeEnvFile({
    APP_NAME,
    BASE_URL,
    APP_LOGO,
    POSTGRES_URL,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    AUTH_SECRET,
    ...pushNotificationsConfig,
    ...nextAuthConfig,
  });

  console.log('🎉 Setup completed successfully!');
}

main().catch(console.error);
