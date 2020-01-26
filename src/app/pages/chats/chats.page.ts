import { ChatsService } from './../../services/chats.service';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
})
export class ChatsPage implements OnInit {
groubs: Observable<any>;
  constructor(private auth: AuthService, private rout: Router, private chatSer: ChatsService) { }

  ngOnInit() {
    this.groubs = this.chatSer.getGroups();
  }
  signOut(){
    this.auth.signOut().then(() => {
      this.rout.navigateByUrl('/login');
    });
  }

  go(){
    this.rout.navigateByUrl('/start');
  }
}
