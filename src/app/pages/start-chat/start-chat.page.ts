import { forkJoin } from 'rxjs';
import { ChatsService } from 'src/app/services/chats.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-start-chat',
  templateUrl: './start-chat.page.html',
  styleUrls: ['./start-chat.page.scss'],
})
export class StartChatPage implements OnInit {
users = [];
title = '';
participent = '';

  // tslint:disable-next-line: no-shadowed-variable
  constructor(private chatSer: ChatsService, private rout: Router) { }

  ngOnInit() {
  }

  addUser(){

  let obs =  this.chatSer.findUser(this.participent);
  forkJoin(obs).subscribe(res => {
    console.log('res: ', res);
    for (let data of res) {
      if (data.length > 0 ) {
        this.users.push(data[0]);
      }
    }

    this.participent = '';
  });
  }

  createGroup() {
 this.chatSer.createGroup(this.title, this.users).then(res =>
  {this.rout.navigateByUrl('/chats')});

  }
}
