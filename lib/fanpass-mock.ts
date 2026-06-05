export interface Quest {
  id: string;
  category: "daily" | "weekly" | "season";
  title: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  progress: number;
  target: number;
  current: number;
  completed: boolean;
  resetLabel?: string;
}

export interface RewardNode {
  level: number;
  free?: { icon: string; label: string; claimed: boolean; available: boolean };
  vip?:  { icon: string; label: string; claimed: boolean; available: boolean; isVipOnly: boolean };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarColor: string;
  level: number;
  totalXp: number;
  streak: number;
  isVip: boolean;
  isCurrentUser: boolean;
}

export function getMockQuests(): Quest[] {
  return [
    { id:"d1", category:"daily",  title:"Like 5 exclusive posts",    icon:"❤️",  xpReward:25,  coinReward:0,  progress:60,  target:5,  current:3, completed:false, resetLabel:"12h Left" },
    { id:"d2", category:"daily",  title:"Comment on a livestream",   icon:"💬",  xpReward:15,  coinReward:0,  progress:100, target:1,  current:1, completed:true  },
    { id:"d3", category:"daily",  title:"Watch a full video",        icon:"🎬",  xpReward:20,  coinReward:0,  progress:0,   target:1,  current:0, completed:false },
    { id:"w1", category:"weekly", title:"Subscribe to 2 creators",   icon:"⭐",  xpReward:80,  coinReward:30, progress:50,  target:2,  current:1, completed:false },
    { id:"w2", category:"weekly", title:"Refer a new subscriber",    icon:"👥",  xpReward:100, coinReward:50, progress:0,   target:1,  current:0, completed:false },
    { id:"s1", category:"season", title:"Reach Level 10",            icon:"🏆",  xpReward:500, coinReward:200,progress:40,  target:10, current:4, completed:false },
  ];
}

export function getMockRewardTrack(userLevel: number): RewardNode[] {
  return [
    {
      level: 17,
      free: { icon:"🪙", label:"100 Coins",       claimed:false, available:false },
      vip:  { icon:"🏅", label:"Badge",           claimed:false, available:false, isVipOnly:true  },
    },
    {
      level: 16,
      free: { icon:"😊", label:"Emote Pack",      claimed:false, available:false },
      vip:  { icon:"👤", label:"Elite Profile",   claimed:false, available:false, isVipOnly:true  },
    },
    {
      level: 15,
      free: { icon:"🎁", label:"Claimed",         claimed:true,  available:true  },
      vip:  { icon:"✨", label:"Mystery Box",     claimed:false, available:true,  isVipOnly:true  },
    },
    {
      level: 14,
      free: { icon:"🪙", label:"50 Coins",        claimed:true,  available:true  },
      vip:  { icon:"⭐", label:"Star Reactions",  claimed:false, available:true,  isVipOnly:true  },
    },
  ];
}

export function getMockLeaderboard(currentUserId: string): LeaderboardEntry[] {
  return [
    { rank:1,  userId:"u1", displayName:"alex_wonder",  avatarUrl:null, avatarColor:"#7c3aed", level:42, totalXp:18500, streak:30, isVip:true,  isCurrentUser:false },
    { rank:2,  userId:"u2", displayName:"jenny_luxe",   avatarUrl:null, avatarColor:"#ef3976", level:38, totalXp:15200, streak:22, isVip:true,  isCurrentUser:false },
    { rank:3,  userId:"u3", displayName:"marcos_fan",   avatarUrl:null, avatarColor:"#0ea5e9", level:33, totalXp:12800, streak:18, isVip:false, isCurrentUser:false },
    { rank:4,  userId:"u4", displayName:"starlite99",   avatarUrl:null, avatarColor:"#10b981", level:29, totalXp:10500, streak:14, isVip:true,  isCurrentUser:false },
    { rank:5,  userId:currentUserId, displayName:"You", avatarUrl:null, avatarColor:"#ef3976", level:15, totalXp:4200,  streak:5,  isVip:false, isCurrentUser:true  },
  ];
}