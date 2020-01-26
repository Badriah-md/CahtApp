import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from 'firebase';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { take, map, tap } from 'rxjs/operators';

export interface UserCredentials {
  nickname: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: User = null;
  nickname = '';
 
  constructor(private afAuth: AngularFireAuth, private db: AngularFirestore) {
    this.afAuth.authState.subscribe(res => {
      this.user = res;
      if (this.user) {
        this.db.doc(`users/${this.currentUserId}`).valueChanges().pipe(
          tap(res => {
            this.nickname = res['nickname'];
          })
        ).subscribe();
      }
    });
   }
   signUp(credentials: UserCredentials) {
    return this.afAuth.auth.createUserWithEmailAndPassword(credentials.email, credentials.password)
      .then((data) => {
        return this.db.doc(`users/${data.user.uid}`).set({
          nickname: credentials.nickname,
          email: data.user.email,
          created: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
  }
   isNicknameAvailable(name) {
    return this.db.collection('users', ref => ref.where('nickname', '==', name).limit(1)).valueChanges().pipe(
      take(1),
      map(user =>{
        return user;
      })
    );
  }
 
  signIn(credentials: UserCredentials) {
    return this.afAuth.auth.signInWithEmailAndPassword(credentials.email, credentials.password);
  }
 
  signOut() {
    return this.afAuth.auth.signOut();
  }
 
  resetPw(email) {
    return this.afAuth.auth.sendPasswordResetEmail(email);
  }
 
  updateUser(nickname) {
    return this.db.doc(`users/${this.currentUserId}`).update({
      nickname
    });
  }
 
  get authenticated(): boolean {
    return this.user !== null;
  }
 
  get currentUser(): any {
    return this.authenticated ? this.user : null;
  }
 
  get currentUserId(): string {
    return this.authenticated ? this.user.uid : '';
  }
  
  }