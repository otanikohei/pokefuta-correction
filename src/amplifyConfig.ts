import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

// Amplify設定を有効化
Amplify.configure(outputs);

console.log('Amplify設定が有効化されました');

export default outputs;