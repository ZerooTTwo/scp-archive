import type { Clearance } from '../lib/types';

export interface TaskforceMember {
  callsign: string;
  role: string;
  status: 'active' | 'kia' | 'missing';
}

export interface Taskforce {
  id: string;
  name: string;
  alias: string;
  nickname: string;
  motto: string;
  role: string;
  base: string;
  clearance: Clearance;
  status: string;
  operations: string[];
  equipment: string[];
  roster: TaskforceMember[];
}

/**
 * A small, curated roster of well-known Mobile Task Forces. This is flavour for
 * the reading experience, not an exhaustive copy of the wiki's task-force list.
 */
export const TASKFORCES: Taskforce[] = [
  {
    id: 'alpha-1',
    name: 'Alpha-1',
    alias: 'Red Right Hand',
    nickname: '红右手',
    motto: '“他们替议会合上档案。”',
    role: 'O5 议会直属护卫与特别行动单位，负责最高级别保留档案的实体安全。',
    base: 'Site-01 / 未公开',
    clearance: 'o5',
    status: '常设 · 最高优先级',
    operations: [
      'O5 议会成员贴身护卫',
      'Site-01 内环封锁与反渗透',
      '对叛逃高层的定点回收',
      '“红右手”协议下的记忆删除执行',
    ],
    equipment: ['定制战术套件', '认知危害防护', '议会密钥', '短程 EMP'],
    roster: [
      { callsign: 'A-01', role: '指挥官', status: 'active' },
      { callsign: 'A-07', role: '内环护卫', status: 'active' },
      { callsign: 'A-12', role: '认知战专家', status: 'active' },
      { callsign: 'A-19', role: '突入小组', status: 'kia' },
    ],
  },
  {
    id: 'omega-12',
    name: 'Omega-12',
    alias: "Achilles' Heel",
    nickname: '阿喀琉斯之踵',
    motto: '“神也有脚踝。”',
    role: '专精于现实扭曲者与神性实体的高风险接触，通常只在 O5 授权下出动。',
    base: 'Site-17 / 临时前沿',
    clearance: 'o5',
    status: '待命 · 限制出动',
    operations: [
      '现实扭曲者收容',
      '神性实体谈判与压制',
      '异常武器化现场评估',
    ],
    equipment: ['斯克兰顿现实稳定锚', '相位锁', '远程观测阵列'],
    roster: [
      { callsign: 'Ω-3', role: '现场指挥', status: 'active' },
      { callsign: 'Ω-8', role: '现实稳定技师', status: 'active' },
      { callsign: 'Ω-11', role: '谈判员', status: 'missing' },
    ],
  },
  {
    id: 'nu-7',
    name: 'Nu-7',
    alias: 'Hammer Down',
    nickname: '落锤',
    motto: '“先落锤，再提问。”',
    role: '营级规模的重装机动部队，负责大规模收容失效、站点夺回与常规军事对抗。',
    base: 'Armed Site-13',
    clearance: 'l4',
    status: '战备 · 快速反应',
    operations: [
      '站点夺回与外围封锁',
      '大规模收容失效压制',
      '重装备护送与火力支援',
      '异常生物群体清除',
    ],
    equipment: ['装甲运兵车', '重机枪组', '直升机支援', '反异常弹药'],
    roster: [
      { callsign: 'N-01', role: '营长', status: 'active' },
      { callsign: 'N-14', role: '突击连长', status: 'active' },
      { callsign: 'N-22', role: '火力协调', status: 'active' },
      { callsign: 'N-31', role: '工兵组', status: 'active' },
      { callsign: 'N-40', role: '医疗组', status: 'kia' },
    ],
  },
  {
    id: 'epsilon-11',
    name: 'Epsilon-11',
    alias: 'Nine-Tailed Fox',
    nickname: '九尾狐',
    motto: '“锁门，清场，收容。”',
    role: '基金会最常被部署的站点收容响应单位，专门处理收容失效与内部入侵。',
    base: 'Site-19 / 快速响应',
    clearance: 'l4',
    status: '常设 · 站点响应',
    operations: [
      'Site-19 收容失效响应',
      '内部安全与叛逃追捕',
      '异常实体现场重收容',
      '与站点安保的联合封锁',
    ],
    equipment: ['标准收容套件', '战术头盔', '非致命压制武器', '现场稳定锚'],
    roster: [
      { callsign: 'E-01', role: '指挥官', status: 'active' },
      { callsign: 'E-06', role: '收容专家', status: 'active' },
      { callsign: 'E-11', role: '破门手', status: 'active' },
      { callsign: 'E-17', role: '医疗兵', status: 'active' },
      { callsign: 'E-23', role: '观察员', status: 'active' },
    ],
  },
  {
    id: 'beta-7',
    name: 'Beta-7',
    alias: 'Maz Hatters',
    nickname: '疯狂帽匠',
    motto: '“先消毒，再收尸。”',
    role: '处理生化、辐射与有害物质污染的专业单位，以极端环境作业著称。',
    base: 'Bio-Site-7',
    clearance: 'l3',
    status: '待命 · 危险环境',
    operations: [
      '生化污染区封锁',
      '异常病原体采样',
      '辐射热点清理',
    ],
    equipment: ['全封闭防护服', '便携消毒站', '远程采样臂', '碘化钾补给'],
    roster: [
      { callsign: 'B-02', role: '现场指挥', status: 'active' },
      { callsign: 'B-09', role: '生化专家', status: 'active' },
      { callsign: 'B-15', role: '洗消组', status: 'active' },
    ],
  },
  {
    id: 'eta-10',
    name: 'Eta-10',
    alias: 'See No Evil',
    nickname: '非礼勿视',
    motto: '“不要看。不要记住。”',
    role: '专精于视觉认知危害与模因污染的调查、封锁与记忆处理。',
    base: 'Site-59 / 认知危害部',
    clearance: 'l3',
    status: '待命 · 模因防护',
    operations: [
      '视觉模因现场评估',
      '认知危害影像回收',
      '目击者记忆删除',
    ],
    equipment: ['遮光护目镜', '模因过滤镜片', '记忆删除剂', '隔离放映室'],
    roster: [
      { callsign: 'H-03', role: '模因学家', status: 'active' },
      { callsign: 'H-07', role: '影像分析师', status: 'active' },
      { callsign: 'H-12', role: '记忆处理员', status: 'active' },
    ],
  },
];
