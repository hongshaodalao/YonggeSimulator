// 问题卡数据。unlock: 1=初始可用, 2=完成3单解锁, 3=完成7单解锁
const QUESTIONS = [
  // 资金类
  { id: "z_total",      cat: "资金", unlock: 1, text: "总预算多少？钱都备齐了吗？" },
  { id: "z_source",     cat: "资金", unlock: 1, text: "这些钱是自己的积蓄、家里支持，还是借的？" },
  { id: "z_buffer",     cat: "资金", unlock: 1, text: "开店的钱之外，手上还有过日子的余粮吗？打算扛多久？" },
  { id: "z_transfer",   cat: "资金", unlock: 1, text: "转让费多少？里面都包含什么？" },
  { id: "z_rent",       cat: "资金", unlock: 1, text: "房租多少？押几付几？合同签几年？" },

  // 位置类
  { id: "w_location",   cat: "位置", unlock: 1, text: "铺子具体在什么位置？街边、社区、商场还是商住综合体？" },
  { id: "w_traffic",    cat: "位置", unlock: 1, text: "门口人流量怎么样？什么时段人最多？" },
  { id: "w_neighbor",   cat: "位置", unlock: 1, text: "隔壁和对面都是什么店？" },
  { id: "w_why_vacant", cat: "位置", unlock: 1, text: "前一家店为什么转让？干了多久？" },
  { id: "w_landlord",   cat: "位置", unlock: 1, text: "房东是产权人吗？租约跟谁签？" },
  { id: "w_future",     cat: "位置", unlock: 1, text: "这一片有没有拆迁、修路、改造的风声？" },

  // 品类与经营
  { id: "p_what",        cat: "经营", unlock: 1, text: "打算做什么品类？为什么选它？" },
  { id: "p_skill",       cat: "经营", unlock: 1, text: "你自己会这个手艺吗？练了多久？" },
  { id: "p_experience",  cat: "经营", unlock: 1, text: "之前做过餐饮吗？在哪儿干过？" },
  { id: "p_target",      cat: "经营", unlock: 1, text: "客单价定多少？一天卖多少能保本，这笔账算过吗？" },
  { id: "p_staff",       cat: "经营", unlock: 1, text: "请人吗？还是自己一家子干？" },
  { id: "p_licensing",   cat: "经营", unlock: 1, text: "证照能办下来吗？现在办到哪一步了？" },
  { id: "p_competition", cat: "经营", unlock: 1, text: "附近有几家做同样品类的？你比人家强在哪？" },

  // 动机类
  { id: "m_why",       cat: "动机", unlock: 1, text: "为什么想开店？现在还在上班吗？" },
  { id: "m_research",  cat: "动机", unlock: 1, text: "去别人店里打过工或者蹲过点吗？调研了多久？" },

  // 加盟类（仅 franchise 案例显示）
  { id: "f_channel", cat: "加盟", unlock: 1, text: "这个加盟品牌，你是从哪里知道的？刷到的广告还是朋友开的店？" },
  { id: "f_hq",      cat: "加盟", unlock: 1, text: "总部在哪个城市？公司什么时候成立的？" },
  { id: "f_visit",   cat: "加盟", unlock: 1, text: "总部去过吗？他们的直营店你进过后厨吗？" },
  { id: "f_stores",  cat: "加盟", unlock: 1, text: "全国现在有多少家店？开满两年的有多少？" },

  // 高级动作
  { id: "a_stakeout",  cat: "动作", unlock: 2, text: "亲自去蹲点数人流，早中晚各蹲一小时" },
  { id: "a_askpeer",   cat: "动作", unlock: 2, text: "找同行打听，套一套这条街的真实经营状况" },
  { id: "a_checkbiz",  cat: "动作", unlock: 3, text: "查工商信息，看这家铺子转过几手、有没有纠纷" },
  { id: "a_rentbook",  cat: "动作", unlock: 3, text: "让前老板当面打开收款后台，看真实流水" },
];
