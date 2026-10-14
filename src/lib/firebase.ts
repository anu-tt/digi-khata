import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  deleteField,
  writeBatch,
  runTransaction,
  getDocFromServer,
  query,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, KhataParty, KhataEntry } from '../types/khata';
import { EncryptedPayload } from './crypto';

// 1. Initialize Firebase App, Auth, & Firestore with custom Database ID
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Test Connection on Boot (as mandated by Firebase guidelines)
export async function testFirebaseConnection(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    const msg = error?.message || String(error);
    const code = error?.code;
    if (code === 'unavailable' || msg.includes('the client is offline') || msg.includes('unavailable')) {
      console.warn('Firebase client is currently operating in offline mode.');
    }
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    testFirebaseConnection().catch(() => {});
  }, 1000);
}

// 3. Error Handler conforming to FirestoreErrorInfo standard
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Firebase Authentication Helpers
export async function signInWithGoogleFirebase(): Promise<{ user: FirebaseUser }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return { user: result.user };
}

export async function signInWithEmailPassword(email: string, password: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (!result.user.emailVerified) {
    await sendEmailVerification(result.user);
    await fbSignOut(auth);
    throw new Error('A verification email was sent. Verify your email, then sign in again.');
  }
  return result.user;
}

export async function createEmailPasswordAccount(email: string, password: string): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  await fbSignOut(auth);
  throw new Error('Verification email sent. Verify your email, then sign in.');
}

export async function logOutFirebase(): Promise<void> {
  await fbSignOut(auth);
}

export { onAuthStateChanged };

// 5. Firestore User Profile CRUD
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    const userDocRef = doc(db, 'users', profile.id);
    await setDoc(
      userDocRef,
      {
        id: profile.id,
        name: profile.name,
        email: profile.email || '',
        businessName: profile.businessName || '',
        address: profile.address || '',
        avatar: profile.avatar || '',
        pinHash: profile.pinHash || deleteField(),
        pinSalt: profile.pinSalt || deleteField(),
        securityQuestion: profile.securityQuestion || deleteField(),
        securityAnswerHash: profile.securityAnswerHash || deleteField(),
        passwordHash: profile.passwordHash || deleteField(),
        passwordSalt: profile.passwordSalt || deleteField(),
        isBiometricEnabled: profile.isBiometricEnabled || false,
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// Read legacy plaintext records only to migrate older installs to encrypted backups.
export async function fetchUserFirestoreData(
  userId: string
): Promise<{ profile: UserProfile | null; parties: KhataParty[]; entries: KhataEntry[] }> {
  try {
    const profile = await getUserProfileFromFirestore(userId);
    if (!profile) return { profile: null, parties: [], entries: [] };

    const partiesRef = collection(db, 'users', userId, 'parties');
    const partiesSnap = await getDocs(partiesRef);
    const parties: KhataParty[] = [];
    partiesSnap.forEach((d) => {
      parties.push(d.data() as KhataParty);
    });

    const txRef = collection(db, 'users', userId, 'transactions');
    const txSnap = await getDocs(txRef);
    const entries: KhataEntry[] = [];
    txSnap.forEach((d) => {
      entries.push(d.data() as KhataEntry);
    });

    return { profile, parties, entries };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${userId}`);
  }
}

export async function findLegacyUserIdsByEmail(email: string, currentUserId: string): Promise<string[]> {
  const usersQuery = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs
    .map((item) => item.id)
    .filter((id) => id !== currentUserId && id.startsWith('usr_'));
}

export async function saveEncryptedVaultToFirestore(userId: string, payload: EncryptedPayload): Promise<void> {
  const collectionRef = collection(db, 'users', userId, 'vault');
  const generation = crypto.randomUUID().replace(/-/g, '');
  const chunkSize = 700_000;
  const chunkCount = Math.ceil(payload.ciphertext.length / chunkSize);
  if (chunkCount < 1 || chunkCount > 500) throw new Error('Encrypted backup is too large to sync.');

  for (let offset = 0, index = 0; offset < payload.ciphertext.length; offset += chunkSize, index++) {
    await setDoc(doc(collectionRef, `chunk_${generation}_${index}`), {
      userId,
      generation,
      index,
      ciphertext: payload.ciphertext.slice(offset, offset + chunkSize),
    });
  }

  // Publish the manifest last so interrupted uploads leave the previous snapshot usable.
  const manifestRef = doc(collectionRef, 'encrypted');
  const previousGeneration = await runTransaction(db, async (transaction) => {
    const current = await transaction.get(manifestRef);
    const oldGeneration = current.data()?.generation;
    transaction.set(manifestRef, {
    userId,
    generation,
    chunksCount: chunkCount,
    iv: payload.iv,
    salt: payload.salt,
    version: payload.version,
    updatedAt: new Date().toISOString(),
    });
    return typeof oldGeneration === 'string' ? oldGeneration : null;
  });

  // Migrate old readable ledger documents only after the encrypted backup is committed.
  for (const collectionName of ['parties', 'transactions'] as const) {
    const snapshot = await getDocs(collection(db, 'users', userId, collectionName));
    for (let offset = 0; offset < snapshot.docs.length; offset += 450) {
      const batch = writeBatch(db);
      snapshot.docs.slice(offset, offset + 450).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }
  }

  const oldVaultDocs = previousGeneration ? await getDocs(collectionRef) : null;
  const previousPrefix = previousGeneration ? `chunk_${previousGeneration}_` : '';
  const obsoleteChunks = oldVaultDocs?.docs.filter((item) => item.id.startsWith(previousPrefix)) || [];
  for (let offset = 0; offset < obsoleteChunks.length; offset += 450) {
    const batch = writeBatch(db);
    obsoleteChunks.slice(offset, offset + 450).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

export async function getEncryptedVaultFromFirestore(userId: string): Promise<EncryptedPayload | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const snapshot = await getDoc(doc(db, 'users', userId, 'vault', 'encrypted'));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (typeof data.iv !== 'string' || typeof data.salt !== 'string') throw new Error('Cloud backup format invalid hai.');
    if (typeof data.ciphertext === 'string') {
      return { ciphertext: data.ciphertext, iv: data.iv, salt: data.salt, version: data.version || 1 };
    }
    if (typeof data.generation !== 'string' || !Number.isInteger(data.chunksCount) || data.chunksCount < 1 || data.chunksCount > 500) {
      throw new Error('Cloud backup manifest invalid hai.');
    }
    const collectionRef = collection(db, 'users', userId, 'vault');
    const chunks = await getDocs(query(collectionRef, where('generation', '==', data.generation)));
    const orderedChunks = chunks.docs.sort((left, right) => left.data().index - right.data().index);
    if (orderedChunks.length === data.chunksCount && orderedChunks.every((item, index) => item.data().index === index && typeof item.data().ciphertext === 'string')) {
      return {
        ciphertext: orderedChunks.map((item) => item.data().ciphertext as string).join(''),
        iv: data.iv,
        salt: data.salt,
        version: data.version || 1,
      };
    }
  }
  throw new Error('Cloud backup is changing or incomplete. Try again shortly.');
}

export async function deleteLegacyFirestoreAccount(userId: string): Promise<void> {
  for (const collectionName of ['parties', 'transactions', 'vault'] as const) {
    const snapshot = await getDocs(collection(db, 'users', userId, collectionName));
    for (let offset = 0; offset < snapshot.docs.length; offset += 450) {
      const batch = writeBatch(db);
      snapshot.docs.slice(offset, offset + 450).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }
  }
  await deleteDoc(doc(db, 'users', userId));
}

// Completely delete cloud data for one user.
export async function deleteAllUserFirestoreData(userId: string): Promise<void> {
  try {
    for (const collectionName of ['parties', 'transactions', 'vault'] as const) {
      const snapshot = await getDocs(collection(db, 'users', userId, collectionName));
      for (let offset = 0; offset < snapshot.docs.length; offset += 450) {
        const batch = writeBatch(db);
        snapshot.docs.slice(offset, offset + 450).forEach((item) => batch.delete(item.ref));
        await batch.commit();
      }
    }

    // Delete root user document
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);

    // If currently signed-in auth user matches, delete auth account or sign out
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        await auth.currentUser.delete();
      } catch {
        await fbSignOut(auth);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
  }
}
