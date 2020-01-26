import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { ChatsService } from './../../services/chats.service';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { map, tap } from 'rxjs/operators';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {

  messages: Observable<any[]>;
  newMsg = '';
  chatTitle = '';
  currentUserId = this.auth.currentUserId;
  chat = null;
   content: IonContent;
   msgInput: ElementRef;
 
  constructor(private route: ActivatedRoute, private auth: AuthService, private chatService: ChatsService, private router: Router,
    private af: AngularFireAuth) { }
 
  ngOnInit() {
    this.route.params.subscribe(data => {
      this.chatService.getOneGroup(data.id).subscribe(res => {
        this.chat = res;
        this.messages = this.chatService.getChatMessages(this.chat.id).pipe(
          map(messages => {
            for (let msg of messages) {
              msg['user'] = this.getMsgFromName(msg['from']);
            }
            return messages;
          }),
          tap(() => {
            setTimeout(() => {
              this.content.scrollToBottom(300);
            }, 500);
          })
        );
      });
    });
  }
 
  sendMessage() {
    this.chatService.addChatMessage(this.newMsg, this.chat.id).then(() => {
      this.newMsg = '';
      this.content.scrollToBottom();
    });
  }
 
  getMsgFromName(userId) {
    for (let usr of this.chat.users) {
      if (usr.id == userId) {
        return usr.nickname;
      }
    }
    return 'Deleted';
  }
 
  resize() {
    this.msgInput.nativeElement.style.height = this.msgInput.nativeElement.scrollHeight + 'px';
  }
 
  leave() {
    let newUsers = this.chat.users.filter(usr => usr.id != this.auth.currentUserId);
 
    this.chatService.leaveGroup(this.chat.id, newUsers).subscribe(res => {
      this.router.navigateByUrl('/chats');
    });
  }
}
