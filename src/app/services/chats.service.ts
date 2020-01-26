import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { take, map, switchMap } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import { forkJoin, from } from 'rxjs';
import { AngularFireStorage, AngularFireStorageReference } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class ChatsService {

  constructor(private db: AngularFirestore, private auth: AuthService, private storage: AngularFireStorage) { }

  findUser(value) {
    let email = this.db.collection('users', ref => ref.where('email', '==', value)).snapshotChanges().pipe(
      take(1),
      map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
    let nickname = this.db.collection('users', ref => ref.where('nickname', '==', value)).snapshotChanges().pipe(
      take(1),
      map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
    return [email, nickname];
  }

  createGroup(title, users) {
    let current = {
      email: this.auth.currentUser.email,
      id: this.auth.currentUserId,
      nickname: this.auth.nickname
    };

    let allUsers = [current, ...users];
    return this.db.collection('groups').add({
      title: title,
      users: allUsers
    }).then(res => {
      let promises = [];

      for (let usr of allUsers) {
        let oneAdd = this.db.collection(`users/${usr.id}/groups`).add({
          id: res.id
        });
        promises.push(oneAdd);
      }
      return Promise.all(promises);
    })
  }

  getGroups() {
    return this.db.collection(`users/${this.auth.currentUserId}/groups`).snapshotChanges().pipe(
      map(actions => actions.map(a => {
       
        const data = a.payload.doc.data();
        const user_group_key = a.payload.doc.id;
        return this.getOneGroup(data['id'], user_group_key);
      }))
    );
  }

  getOneGroup(id, user_group_key = null) {
    return this.db.doc(`groups/${id}`).snapshotChanges().pipe(
      take(1),
      map(changes => {
        const data = changes.payload.data();
        const group_id = changes.payload.id;
        return { user_group_key, id: group_id, ...data };
      })
    )
  }

  getChatMessages(groupId) {
    return this.db.collection(`groups/${groupId}/messages`, ref => ref.orderBy('createdAt')).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    )
  }

  addChatMessage(msg, chatId) {
    return this.db.collection('groups/' + chatId + '/messages').add({
      msg: msg,
      from: this.auth.currentUserId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  addFileMessage(file, chatId) {
    let newName = `${new Date().getTime()}-${this.auth.currentUserId}.png`;
    let storageRef: AngularFireStorageReference = this.storage.ref(`/files/${chatId}/${newName}`);
    return {task: storageRef.putString(file, 'base64', { contentType: 'image/png'}), ref: storageRef };
  }

  saveFileMessage(filepath, chatId) {
    return this.db.collection('groups/' + chatId + '/messages').add({
      file: filepath,
      from: this.auth.currentUserId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  leaveGroup(groupId, users) {
    return this.getGroups().pipe(
      switchMap(userGroups => {
        return forkJoin(userGroups);
      }),
      map(data => {
        let toDelete = null;

        for (let group of data) {
          if (group.id === groupId) {
            toDelete = group.user_group_key;
          }
        }
        return toDelete;
      }),
      switchMap(deleteId => {
        return from(this.db.doc(`users/${this.auth.currentUserId}/groups/${deleteId}`).delete())
      }),
      switchMap(() => {
        return from(this.db.doc(`groups/${groupId}`).update({
          users: users
        }));
      })
    );
  }

}
