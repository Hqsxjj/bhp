// 学习中心 - 微信营销与账号运营手册
export const LEARN_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover">
  <title>学习中心</title>
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icon.svg">
  <style>
    :root {
      --bg-app: #f2f2f7;
      --card-bg: rgba(255,255,255,0.95);
      --card-border: rgba(0,0,0,0.04);
      --text-main: #1c1c1e;
      --text-soft: #3a3a3c;
      --text-light: #5c5c60;
      --btn-bg: rgba(0,0,0,0.04);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; }
    body {
      font-family: -apple-system, 'SF Pro', 'Helvetica Neue', sans-serif;
      background: var(--bg-app); color: var(--text-main);
      min-height: 100vh; -webkit-overflow-scrolling: touch;
    }

    .learn-header {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      background: rgba(242,242,247,0.85); border-bottom: 0.5px solid var(--card-border);
      position: sticky; top: 0; z-index: 10;
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    }
    .learn-back-btn {
      font-size: 0.8rem; padding: 6px 12px; border: none; background: var(--btn-bg);
      color: #4a6cf7; cursor: pointer; outline: none; font-weight: 700;
      border-radius: 999px; white-space: nowrap; text-decoration: none;
      min-width: 44px; min-height: 34px; display: inline-flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    }
    .learn-header-title {
      font-size: 1.05rem; font-weight: 700; color: var(--text-main);
      letter-spacing: -0.01em;
    }
    .learn-body {
      padding: 20px 16px 40px; overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    .learn-article { max-width: 680px; margin: 0 auto; }
    .learn-article h1 {
      font-size: 1.5rem; font-weight: 900; color: var(--text-main);
      letter-spacing: -0.02em; line-height: 1.25; margin: 0 0 6px;
    }
    .learn-article .learn-subtitle {
      font-size: 0.78rem; color: var(--text-light); font-weight: 500;
      margin-bottom: 24px; line-height: 1.5;
    }
    .learn-article h2 {
      font-size: 1.15rem; font-weight: 800; color: var(--text-main);
      letter-spacing: -0.01em; margin: 28px 0 10px; padding-top: 12px;
      border-top: 0.5px solid var(--card-border);
    }
    .learn-article h2:first-of-type { border-top: none; padding-top: 0; margin-top: 20px; }
    .learn-article h3 {
      font-size: 0.95rem; font-weight: 700; color: var(--text-main);
      letter-spacing: -0.01em; margin: 16px 0 6px;
    }
    .learn-article h4 {
      font-size: 0.85rem; font-weight: 700; color: var(--text-soft);
      margin: 12px 0 4px;
    }
    .learn-article p {
      font-size: 0.82rem; color: var(--text-soft); line-height: 1.7;
      margin: 0 0 8px;
    }
    .learn-article ul, .learn-article ol {
      margin: 0 0 10px; padding-left: 18px;
      font-size: 0.8rem; color: var(--text-soft); line-height: 1.7;
    }
    .learn-article li { margin-bottom: 2px; }
    .learn-article .learn-highlight {
      background: var(--card-bg); border-radius: 10px; padding: 12px 14px;
      margin: 10px 0; border-left: 3px solid #4a6cf7;
    }
    .learn-article .learn-highlight p { margin-bottom: 4px; }
    .learn-article .learn-highlight p:last-child { margin-bottom: 0; }
    .learn-article strong { color: var(--text-main); font-weight: 700; }
    .learn-toc {
      background: var(--card-bg); border-radius: 16px; padding: 16px;
      margin-bottom: 24px;
    }
    .learn-toc-title {
      font-size: 0.78rem; font-weight: 700; color: var(--text-main);
      margin-bottom: 8px; letter-spacing: -0.01em;
    }
    .learn-toc a {
      display: block; font-size: 0.74rem; color: #4a6cf7; text-decoration: none;
      padding: 3px 0; font-weight: 600; line-height: 1.5;
    }
    .learn-article hr {
      border: none; border-top: 0.5px solid var(--card-border);
      margin: 24px 0;
    }
    .learn-article .section-accent {
      display: inline-block; width: 4px; height: 18px; border-radius: 2px;
      background: #4a6cf7; margin-right: 8px; vertical-align: middle;
      position: relative; top: -1px;
    }
  </style>
</head>
<body>
  <div class="learn-header">
    <a class="learn-back-btn" href="/">返回</a>
    <span class="learn-header-title">学习中心</span>
  </div>
  <div class="learn-body">
    <div class="learn-article">
      <h1>微信营销与账号运营完全手册</h1>
      <p class="learn-subtitle">加人策略 · 账号养号 · 朋友圈运营 · 客户转化 · 风控合规</p>

      <div class="learn-toc">
        <div class="learn-toc-title">目录</div>
        <a href="#l1">一、核心目标与增长模型</a>
        <a href="#l2">二、设备与账号配置</a>
        <a href="#l3">三、加人操作细则</a>
        <a href="#l4">四、加人后的转化与筛选</a>
        <a href="#l5">五、微信养号与权重提升</a>
        <a href="#l6">六、群发与朋友圈运营</a>
        <a href="#l7">七、客户跟进与裂变</a>
        <a href="#l8">八、工作习惯及达到的要求</a>
        <a href="#l9">九、微信使用规范和养号技巧汇总</a>
      </div>

      <h2 id="l1"><span class="section-accent"></span>一、核心目标与增长模型</h2>
      <h3>想尽办法增加好友数：广度</h3>
      <p><strong>主动加人：</strong>电销意向、盲加目标客户、维护微信的真实亲戚好友、其他社交软件引导来的</p>
      <p><strong>被动加人：</strong>维护微信的网友，多聊天的、多沟通的</p>

      <div class="learn-highlight">
        <p><strong>指数增长逻辑：</strong></p>
        <p>1个微信每天保底要求50-100个</p>
        <p>一个月1个微信累计加人500-1000人</p>
        <p>手动加人是可以加到这么多的</p>
        <p>1个微信50个新好友 &times; 300天 = 15000个人</p>
        <p>5个微信平均每个微信天均100个人 &times; 300天 = 30000个人</p>
      </div>

      <h2 id="l2"><span class="section-accent"></span>二、设备与账号配置</h2>
      <p>最好一个手机一个或者两个微信，如果5个微信就是最少准备2-3台手机（想办法搞到个这2到3台安卓手机）</p>
      <p>一个人可以实名5个微信，先把这5个微信给维护好，养成一个正常的号</p>
      <p><strong>正常号的标准：</strong>1000人以上，每天都有固定聊天的</p>
      <p>微信要开屏在线的时间足够成一个正常微信，每天都和人聊天，尽量一个手机一个微信，不要微信切来切去</p>

      <h2 id="l3"><span class="section-accent"></span>三、加人操作细则</h2>

      <h3>（一）加人节奏控制</h3>
      <p>不要集中在一个时间段去加人，挑头像加人，每小时连续点超过10次被加的人就收不到微信打招呼</p>
      <p><strong>加人黄金时间：</strong>早上9点左右，中午休息时间，下午6点下班后</p>
      <p><strong>具体操作节奏：</strong></p>
      <ol>
        <li>早会后开始第一波加人，每个号一波5个发送（打招呼语默认系统我是XXX）</li>
        <li>有验证通过的微信继续发送5个添加（自动通过的不算），一直通过可以一直加</li>
        <li>发送5个没有通过的，2-3小时后再进行第二波添加</li>
        <li>出现搜索频繁、加人频繁可以被动添加1个，等2小时后可以继续添加</li>
        <li>通过尽量都打一下招呼，随便聊几句增加权重（hi，hello）</li>
      </ol>

      <h3>（二）提升微信通过率方式</h3>
      <h4>形象塑造：提升第一印象通过率</h4>
      <p>在添加好友前，必须精心包装以下几个要素，让对方觉得你是一个真实、可信的"正常人"：</p>
      <ul>
        <li>微信头像：清晰、正面、有亲和力</li>
        <li>个性签名：积极、正能量，避免广告和负面情绪</li>
        <li>背景图：美观、得体，与头像风格协调</li>
        <li>朋友圈/视频号：有日常生活的分享内容，不要是空白或全是广告</li>
      </ul>

      <h4>添加策略：核心技巧与时机</h4>
      <p><strong>最佳添加时间段（流量高峰，通过率最高）：</strong></p>
      <ul>
        <li>上午：8:00 - 9:00（上班路上或刚上班时）</li>
        <li>中午：11:30 - 12:30（午休时间）</li>
        <li>晚上：19:30 - 21:00（下班后休闲时间）</li>
      </ul>

      <p><strong>主要添加方法：</strong></p>
      <ul>
        <li><strong>支付宝溯源法：</strong>在支付宝搜索对方名字，使用"XX先生/女士"等尊称打招呼，再进行添加，增加信任度</li>
        <li><strong>通讯录导入法：</strong>优先将号码导入手机通讯录，再通过微信的"添加手机联系人"功能添加，这样显示的是"来自手机联系人"，通过率更高</li>
      </ul>

      <p><strong>被动添加法（应对频繁限制）：</strong></p>
      <ul>
        <li><strong>场景选择：</strong>前往"汽车之家"等平台，选择各大品牌（尤其优先新能源品牌，此类车主通常有稳定收入和公积金，是优质客户）</li>
        <li><strong>操作流程：</strong>在论坛或车友圈互动，切勿直接交换手机号。可以自然地表示"我的微信是XXX，可以交流用车经验"，吸引有需求的车主主动来加你</li>
      </ul>

      <h4>风险控制与效率提升</h4>
      <p><strong>控制添加节奏：</strong></p>
      <ul>
        <li><strong>5:1通过率原则：</strong>每添加5个人，至少要保证有1个通过。如果通过率太低，可以临时添加自己人（小号）来维持健康的通过率数据</li>
        <li><strong>切忌盲目添加：</strong>严禁一次性添加几十人却无人通过，这会极大降低账号权重，容易被系统判定为营销号</li>
      </ul>

      <p><strong>提升添加效率：</strong></p>
      <ul><li><strong>使用PC端微信：</strong>PC版微信进行手动添加操作比手机端更快捷高效</li></ul>

      <p><strong>应对"操作频繁"：</strong></p>
      <p>一旦出现添加频繁的提示，应立即停止添加，并执行以下"养号"动作：</p>
      <ul>
        <li><strong>金融行为：</strong>进行小额转账、发红包</li>
        <li><strong>内容互动：</strong>刷视频号并完成点赞、评论、关注</li>
        <li><strong>微信支付：</strong>使用微信线下消费（扫码付款）</li>
        <li><strong>日常社交：</strong>与好友正常聊天，发布真实的朋友圈</li>
      </ul>

      <p><strong>优化账号与策略：</strong></p>
      <ul>
        <li><strong>成功模式复制：</strong>观察哪个微信号的通过率最高，将其头像、背景图复制到其他账号使用，测试效果</li>
        <li><strong>重点培养主力号：</strong>对于通过率高、比较"硬"（稳定）的账号，可以集中在PC端持续添加</li>
        <li><strong>提升账号权重：</strong>带着需要养的小号进行线下消费、互相转账等真实交易行为，能快速提升账号的信任权重</li>
      </ul>

      <h2 id="l4"><span class="section-accent"></span>四、加人后的转化与筛选</h2>
      <h3>加的人怎么转换：</h3>
      <p>问你的就马上表明身份用几句话聊一下，既可以增加权重，也可以让微信好友不那么容易删除你，介绍你是干嘛的，能给到他什么东西</p>
      <p>要钱的就聊，不要钱的删了也就删了</p>
      <p>但聊的比较好的客户就多聊一些</p>
      <p>回复文案建议都用AI助手来帮忙润色一下，多保存几个回复话术，及时回复合适的话术</p>

      <h3>主动筛选垃圾人群：</h3>
      <p>有些人垃圾头像的人自己看着不对就手动删除，多做垃圾客户的标记，标记0</p>
      <p>聊的不对的人主动删除</p>
      <p>特别排斥中介的人主动删除</p>
      <p>每天加人后都要把客户的备注改完才能下班，保证明天后天客户的群发问早的新增</p>

      <h2 id="l5"><span class="section-accent"></span>五、微信养号与权重提升</h2>

      <h3>（一）怎么保证腾讯不风控封号你？</h3>
      <p>男号一定要真实人设，有能力有专业</p>
      <p>女号一定是需要积累男号解决不了的问题的有用</p>
      <p>每天保底做3次权重，做权重的时间要时时刻刻去做权重</p>

      <p><strong>每天都做的权重工作：</strong></p>
      <ul>
        <li><strong>人设：</strong>自己的号的人设、头像、朋友圈</li>
        <li>每天都发朋友圈，每天都发</li>
        <li>7天以上的号，每天加5-10次加人动作</li>
      </ul>

      <p><strong>聊天：</strong></p>
      <ul>
        <li>和亲戚朋友聊天</li>
        <li>和意向客户聊天</li>
        <li>和盲加好友聊天</li>
        <li>半年以内的号要边加边聊</li>
        <li>记得控制好时间和速度</li>
        <li>多加房产中介和其他的广告业务多聊天</li>
      </ul>

      <p><strong>消费场景：</strong></p>
      <p>发红包，转账，群红包，点外卖，淘宝购物，刷地铁，打车，绑定其他功能软件，绑定身份类的政务生活软件</p>

      <p><strong>浏览：</strong></p>
      <p>浏览购物平台，看小视频，看直播，看文章点赞</p>

      <p><strong>微信功能里的使用：</strong></p>
      <p>无关痛痒的功能不定期的轮流点开，使用的小程序，使用收藏，使用卡包</p>

      <h3>（二）避免被人主动投诉，并且投诉成功</h3>
      <p>群发文案避免出现一些敏感/投诉必封的词汇</p>
      <p>群发不要太过频繁，最多一个礼拜3次</p>

      <h3>（三）养号操作建议</h3>
      <h4>合规准则：</h4>
      <ol>
        <li>新号老号互加好友：使用新号和老号相互加好友，增加联系人数量</li>
        <li>每天进行联系人对话、发语音：每天与联系人进行对话、发送语音消息，增加账号活跃度</li>
        <li>每天至少发送一次朋友圈：每天发布朋友圈动态，增加账号可信度和活跃度</li>
        <li>使用手机流量：在使用微信时，尽量使用手机流量而不是公共Wi-Fi</li>
        <li>开启定位功能：在走路时，打开定位功能并保持移动轨迹，增加账号真实性</li>
        <li>完成实名认证和支付：如果有条件，建议完成实名认证，并进行几次支付，增加账号可信度</li>
      </ol>

      <h4>养号技巧：</h4>
      <ol>
        <li>不要立刻修改全套资料：不要在拿到新号后立即修改全部资料，尤其是不要批量修改。最好让新号先适应当前环境，之后每天修改一两个地方</li>
        <li>避免批量设置相同或有规律的基础信息：不要批量设置相同或有规律的基础信息，如头像、昵称等，以免被识别出来</li>
        <li>避免频繁修改资料：完成资料设置后，避免频繁修改，否则会被认为是异常操作</li>
        <li>不要使用附近的人和摇一摇功能：避免使用附近的人和摇一摇功能，这些功能容易触犯红线并降低账号权重</li>
        <li>避免频繁切换手机登入：避免频繁切换手机或地区登入，以避免被认为是盗号或号商行为</li>
        <li>不要频繁主动加人打招呼：避免频繁主动加人并打招呼，以免被认为是营销加号</li>
        <li>不要开启定位功能：不要开启定位功能，尤其是在新号集中在一个地方操作的情况下，容易被识别出来。可以每隔一段时间打开飞行模式，换个地方登入一下</li>
        <li>避免发送敏感词汇：避免发送包含色情、政治、淘宝、金融等敏感词汇的内容，以免被认为是违法行为。如必须发送，可考虑以图片形式发送。另外，支付宝、付款和银行账号等敏感信息也尽量避免发送</li>
      </ol>

      <h4>养号操作建议：</h4>
      <ol>
        <li>配置基础信息时分散操作：在设置头像、昵称、微信号、个性签名等基础信息时，不要一次性全部设置完，也不要一起设置多个号，避免设置相同或简单的规律性信息</li>
        <li>做好实名认证和多绑定银行卡：在新注册微信号时，最好进行实名认证，并绑定多张银行卡，以提高账号权重和可信度</li>
        <li>与老号互动聊天：在老号微信里给新号备注，并加上标签和电话号码等信息，然后与老号进行互动聊天，稳住客户，并增加新号的活跃度</li>
        <li>频繁和好友互动：每天与3-5个好友进行互动，可以发送文字、语音、视频、图片、文章等多样化的内容，并保持双向交流</li>
        <li>参与群聊和公众号：加入3-5个以上的活跃度群，每天在群里发表情、文字、语音等内容。同时关注和取消关注1-2个公众号，并模拟阅读文章并分享到朋友圈</li>
      </ol>

      <h3>（四）养号的本质</h3>
      <p>养号的本质是模拟真实用户的高活跃、高信任度行为，从而让系统判定你是一个"正常人"，而非营销机器</p>
      <ol>
        <li><strong>立即停止所有营销行为：</strong>7天内严禁：主动加人、被动通过好友、拉群、通过链接或扫码进群、群发消息、发朋友圈广告等</li>
        <li><strong>建立稳定的登录与环境习惯：</strong>稳定设备与网络：固定在一台手机和一个网络环境下登录，避免频繁切换。保持在线：每日保持账号在线，随身携带手机，并开启微信运动功能</li>
        <li><strong>模拟真实支付流水（关键权重）：</strong>在养号期间，通过微信支付完成100笔以上的流水交易。可通过以下方式：线下扫码购物（便利店、超市、餐厅）、使用微信乘车码坐公交/地铁、生活缴费（水电煤、话费充值）、小额理财（零钱通）。注意：避免集中、大额、频繁的转账，尤其是与新好友之间</li>
        <li><strong>进行每日社交互动（点赞评论）：</strong>连续7-15天，每天花3-5分钟进行社交互动：阅读公众号文章并"点赞"、"在看"、评论，浏览视频号并转发、收藏等</li>
        <li><strong>私聊与内容注意事项：</strong>私聊：仅与老好友进行正常聊天，绝对规避敏感词、金融、政治类话题。内容清理：养号前务必彻底删除所有违规内容（朋友圈、聊天记录中的敏感词、广告链接等）。资料稳定：养号期间，严禁修改头像、昵称、签名、收货地址等个人资料</li>
      </ol>

      <h3>（五）不同风险账号的养号周期建议</h3>
      <ul>
        <li>新设备/信息变更/风险提示/异地登录号：需强化养号至少7天</li>
        <li>第一次封号解封后：需强化养号静默3天仅限聊天（7天后可基本恢复）</li>
        <li>长期不登录/低活跃号：需强化养号至少30天</li>
        <li>第二次封号解封后：需强化养号至少15天，可能仅能恢复80%的权重，操作需极其谨慎</li>
        <li>第三次封号解封后：30天建议停止一切营销操作</li>
      </ul>

      <h2 id="l6"><span class="section-accent"></span>六、群发与朋友圈运营</h2>

      <h3>（一）群发策略</h3>
      <p><strong>时常出现在潜在客户池面前</strong></p>
      <p>群发主要是为了时常出现在客户的眼前，那么这个群发就必须有趣，有吸引人的内容</p>

      <p><strong>群发时间和次数：</strong></p>
      <p>平常群发，轮流群发，每150-180以内做分批次分时间群发</p>
      <p>群发不发广告，多发发互动的东西，广告要第二句聊的时候发，一周最多一次发群发广告</p>
      <p>群发的分批触达，每天触达新号的25%，每周触达100%</p>

      <p><strong>群发操作节奏：</strong></p>
      <p>一周找出一天的时间做一个业务类的营销文案，展示我们优势政策、风口性的产品等</p>
      <p>上午群发先介绍，下午群发问客户有没有看到，晚上和这些有回复的激活客户</p>
      <p>发群发要多和客户做成互动性的文案，一定要深入客户想要的东西</p>
      <p>客户主要未知的就是银行对客户的征信和贷款要求的点</p>
      <p>但有些年轻客户是比较好奇，老客户不在乎这些他本身是不懂的，我们要主动帮他做决定的东西比较多一些</p>

      <h3>（二）问早</h3>
      <p>一周发三次问早，一段话加一个图片的问早内容</p>
      <p><strong>问早形式：</strong></p>
      <ol>
        <li>正能量健身，自律锻炼类的问早</li>
        <li>早餐类的问早，做早餐，吃早餐</li>
        <li>包装类的问早内容，健身漏个车标或者其他证明自己有实力的东西</li>
      </ol>

      <h3>（三）问晚安</h3>
      <p>在周五晚上去问晚安</p>
      <p>内容吸引客户聊起来的话题：实时热点新闻，金融政策性的热点新闻，个人展示业绩和经典特殊案例，展示我们的渠道能力</p>
      <p>最好能给客户有自身情况的代入感的案例</p>

      <h3>（四）其他互动</h3>
      <p>其他的时候针对客户人群去发互动性的群发，特别是那种回复率高的客户经常聊去增加微信权重</p>

      <h3>（五）朋友圈策略</h3>
      <p><strong>朋友圈人设：</strong></p>
      <p>男号要积极向上，运动阳光，有特点</p>
      <p>女号要有文艺有生活，自拍照不一定要天天有，侧身半身生活风景照要有</p>
      <p>文案都必须好看</p>
      <p>让人看了就想点赞</p>
      <p>刚起号的朋友圈，要提前多发朋友圈，可以先隐藏起来</p>
      <p>养成顺手点赞的习惯，顺手点每个客户的朋友圈</p>
      <p>周六周日发朋友圈：发的朋友圈以互动性的工作业务笔记，要让客户自己在发自己朋友圈或者有空刷朋友圈的时候顺带刷到我的业务笔记</p>
      <p>每周发一条，然后屏蔽自己其他笔记</p>

      <h2 id="l7"><span class="section-accent"></span>七、客户跟进与裂变</h2>
      <p>每个客户回复后都要在了解客户情况、缔结客户上门之外，想办法让客户做转介绍和拉群</p>
      <p>特别是拉群，回复的客户都要去沟通拉群</p>

      <h2 id="l8"><span class="section-accent"></span>八、工作习惯及达到的要求</h2>
      <div class="learn-highlight">
        <p><strong>每个月固定的工作要求：</strong></p>
        <p>50个-100个微信 &times; 30天 = 1000个微信</p>
        <p>电话开发3-5个微信 &times; 20 = 60个</p>
        <p>2000通接通电话，触达，做到识别客户，识别到要钱的客户</p>
      </div>
      <p>完成了工作量7点下班也有比别人收获的更多，丰富的东西也更多</p>
      <p>打到意向也是收获，加了50个人也是收获，微信养好了权重也是收获</p>
      <p>都是给自己的客户池积累客户</p>
      <p>其余的时间就是解决客户的问题，速约上门解决，没能力的增加自己的解决客户的能力</p>

      <hr>

      <h2 id="l9"><span class="section-accent"></span>九、微信使用规范和养号技巧汇总</h2>
      <p><strong>导语：</strong>微信是一个非常重要的社交工具，但是在使用过程中，我们必须遵守相应的规范，以确保我们的账号安全，并避免违反法律法规。此外，为了更好地养号，我们需要采取一些策略和技巧来提升账号的权重和可信度。下面是一些微信使用规范和养号技巧，希望对大家有所帮助。</p>

      <h3>合规准则：</h3>
      <ol>
        <li>新号老号互加好友</li>
        <li>每天进行联系人对话、发语音</li>
        <li>每天至少发送一次朋友圈</li>
        <li>使用手机流量</li>
        <li>开启定位功能</li>
        <li>完成实名认证和支付</li>
      </ol>

      <h3>养号技巧：</h3>
      <ol>
        <li>不要立刻修改全套资料</li>
        <li>避免批量设置相同或有规律的基础信息</li>
        <li>避免频繁修改资料</li>
        <li>不要使用附近的人和摇一摇功能</li>
        <li>避免频繁切换手机登入</li>
        <li>不要频繁主动加人打招呼</li>
        <li>不要开启定位功能（新号集中操作时）</li>
        <li>避免发送敏感词汇</li>
      </ol>

      <h3>养号操作建议：</h3>
      <ol>
        <li>配置基础信息时分散操作</li>
        <li>做好实名认证和多绑定银行卡</li>
        <li>与老号互动聊天</li>
        <li>频繁和好友互动</li>
        <li>参与群聊和公众号</li>
      </ol>

      <div class="learn-highlight">
        <p><strong>养号的本质是模拟真实用户的高活跃、高信任度行为，从而让系统判定你是一个"正常人"，而非营销机器。</strong></p>
      </div>

      <h3>分阶段养号要点：</h3>
      <ul>
        <li>7天内严禁营销行为</li>
        <li>建立稳定的登录与环境习惯</li>
        <li>模拟真实支付流水（关键权重）</li>
        <li>进行每日社交互动</li>
        <li>私聊注意规避敏感词</li>
      </ul>

      <h3>不同风险账号的养号周期：</h3>
      <ul>
        <li>新设备/风险提示号：至少7天</li>
        <li>第一次封号解封后：静默3天，7天后基本恢复</li>
        <li>长期不登录号：至少30天</li>
        <li>第二次封号解封后：至少15天</li>
        <li>第三次封号解封后：30天停止一切营销操作</li>
      </ul>
    </div>
  </div>
</body>
</html>`;
