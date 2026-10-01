import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
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
  writeBatch,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, KhataParty, KhataEntry } from '../types/khata';

// 1. Initialize Firebase App, Auth, & Firestore with custom Database ID
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Test Connection on Boot (as mandated by Firebase guidelines)
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
  }
}
testFirebaseConnection();

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
  return result.user;
}

export async function createEmailPasswordAccount(email: string, password: string): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logOutFirebase(): Promise<void> {
  await fbSignOut(auth);
}

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
        pinHash: profile.pinHash || '',
        pinSalt: profile.pinSalt || '',
        securityQuestion: profile.securityQuestion || '',
        securityAnswerHash: profile.securityAnswerHash || '',
        isBiometricEnabled: Boolean(profile.isBiometricEnabled),
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

// 6. Firestore Parties Operations
export async function savePartyToFirestore(userId: string, party: KhataParty): Promise<void> {
  const path = `users/${userId}/parties/${party.id}`;
  try {
    const partyDocRef = doc(db, 'users', userId, 'parties', party.id);
    await setDoc(partyDocRef, {
      id: party.id,
      userId,
      name: party.name,
      phone: party.phone || '',
      type: party.type,
      notes: party.notes || '',
      isArchived: Boolean(party.isArchived),
      createdAt: party.createdAt || new Date().toISOString(),
      updatedAt: party.updatedAt || new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePartyFromFirestore(userId: string, partyId: string): Promise<void> {
  const path = `users/${userId}/parties/${partyId}`;
  try {
    const partyDocRef = doc(db, 'users', userId, 'parties', partyId);
    await deleteDoc(partyDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 7. Firestore Transactions Operations
export async function saveTransactionToFirestore(userId: string, entry: KhataEntry): Promise<void> {
  const path = `users/${userId}/transactions/${entry.id}`;
  try {
    const txDocRef = doc(db, 'users', userId, 'transactions', entry.id);
    await setDoc(txDocRef, {
      id: entry.id,
      userId,
      partyId: entry.partyId,
      amount: entry.amount,
      type: entry.type,
      date: entry.date,
      description: entry.description || '',
      attachments: entry.attachments || [],
      syncStatus: 'synced',
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: entry.updatedAt || new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteTransactionFromFirestore(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/transactions/${entryId}`;
  try {
    const txDocRef = doc(db, 'users', userId, 'transactions', entryId);
    await deleteDoc(txDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 8. Pull Complete Cloud Data from Firestore
export async function fetchUserFirestoreData(
  userId: string
): Promise<{ profile: UserProfile | null; parties: KhataParty[]; entries: KhataEntry[] }> {
  try {
    const profile = await getUserProfileFromFirestore(userId);

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

// 9. Sync All Local Data to Firestore Cloud in Batches
export async function syncAllToFirestore(
  userId: string,
  parties: KhataParty[],
  entries: KhataEntry[],
  profile?: UserProfile
): Promise<void> {
  const batch = writeBatch(db);

  if (profile) {
    const userRef = doc(db, 'users', userId);
    batch.set(
      userRef,
      {
        id: profile.id,
        name: profile.name,
        email: profile.email || '',
        businessName: profile.businessName || '',
        address: profile.address || '',
        avatar: profile.avatar || '',
        pinHash: profile.pinHash || '',
        pinSalt: profile.pinSalt || '',
        securityQuestion: profile.securityQuestion || '',
        securityAnswerHash: profile.securityAnswerHash || '',
        isBiometricEnabled: Boolean(profile.isBiometricEnabled),
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  for (const party of parties) {
    const pRef = doc(db, 'users', userId, 'parties', party.id);
    batch.set(pRef, {
      id: party.id,
      userId,
      name: party.name,
      phone: party.phone || '',
      type: party.type,
      notes: party.notes || '',
      isArchived: Boolean(party.isArchived),
      createdAt: party.createdAt || new Date().toISOString(),
      updatedAt: party.updatedAt || new Date().toISOString(),
    });
  }

  for (const entry of entries) {
    const tRef = doc(db, 'users', userId, 'transactions', entry.id);
    batch.set(tRef, {
      id: entry.id,
      userId,
      partyId: entry.partyId,
      amount: entry.amount,
      type: entry.type,
      date: entry.date,
      description: entry.description || '',
      attachments: entry.attachments || [],
      syncStatus: 'synced',
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: entry.updatedAt || new Date().toISOString(),
    });
  }

  await batch.commit();
}

// 10. Completely Delete All User Account Data from Firestore
export async function deleteAllUserFirestoreData(userId: string): Promise<void> {
  try {
    // Delete all parties subcollection
    const partiesRef = collection(db, 'users', userId, 'parties');
    const partiesSnap = await getDocs(partiesRef);
    const pBatch = writeBatch(db);
    partiesSnap.forEach((d) => {
      pBatch.delete(d.ref);
    });
    await pBatch.commit();

    // Delete all transactions subcollection
    const txRef = collection(db, 'users', userId, 'transactions');
    const txSnap = await getDocs(txRef);
    const tBatch = writeBatch(db);
    txSnap.forEach((d) => {
      tBatch.delete(d.ref);
    });
    await tBatch.commit();

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
