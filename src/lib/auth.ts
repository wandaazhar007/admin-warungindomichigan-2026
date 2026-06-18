import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

export async function signInAdmin(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // Verify the user has admin role in custom claims
  const token = await cred.user.getIdTokenResult();
  if (token.claims['role'] !== 'admin') {
    await firebaseSignOut(auth);
    throw new Error('Akun ini tidak memiliki akses admin.');
  }
  localStorage.setItem('wim_admin_token', await cred.user.getIdToken());
  return cred.user;
}

export async function refreshAdminToken(user: User): Promise<void> {
  const token = await user.getIdToken(true);
  localStorage.setItem('wim_admin_token', token);
}

export async function signOutAdmin(): Promise<void> {
  await firebaseSignOut(auth);
  localStorage.removeItem('wim_admin_token');
}
