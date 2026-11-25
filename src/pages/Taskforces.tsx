import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, TopBar } from '../components/ui';
import { TASKFORCES, type Taskforce } from '../data/taskforces';
import {
  CLEARANCES,
  clearanceRank,
  taskforceAccess,
} from '../lib/clearance';
import { useDocumentTitle } from '../lib/hooks';
import { useSettings } from '../state/settings';

function MemberStatus({ status }: { status: Taskforce['roster'][number]['status'] }) {
  const label = status === 'active' ? '在役' : status === 'kia' ? '阵亡' : '失踪';
  return <span className={`tf-status tf-status--${status}`}>{label}</span>;
}

export function Taskforces() {
  useDocumentTitle('机动特遣队');
  const navigate = useNavigate();
  const { settings } = useSettings();
  const access = taskforceAccess(settings.clearance);
  const current = CLEARANCES[settings.clearance];

  const visible = TASKFORCES.filter(
    (taskforce) => clearanceRank(taskforce.clearance) <= clearanceRank(settings.clearance),
  );
  const hiddenCount = TASKFORCES.length - visible.length;

  return (
    <div className="page taskforces-page">
      <TopBar
        title="机动特遣队"
        subtitle="基金会机动特遣队"
        onBack={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      />

      <header className="tf-hero">
        <span className="tf-kicker">控制 · 收容 · 保护</span>
        <h1>机动特遣队</h1>
        <p>
          基金会为特定异常、战术环境与收容任务编组的专业单位。这里只收录公开名录中的
          一小部分，档案会随人员等级开放不同深度。
        </p>
        <div className="tf-hero__clearance">
          <span className={`clearance-seal clearance-seal--${current.id}`}>{current.badge}</span>
          <div>
            <strong>{current.name}</strong>
            <span>
              {access === 'full'
                ? '完整行动档案'
                : access === 'roster'
                  ? '仅名录 · 行动细节受限'
                  : '无特遣队访问权限'}
            </span>
          </div>
        </div>
      </header>

      {access === 'none' ? (
        <div className="tf-locked">
          <span className="tf-locked__icon">
            <Icon name="lock" size={30} />
          </span>
          <h2>访问受限</h2>
          <p>
            机动特遣队的编成与行动记录属于受控档案。当前凭证为
            <strong> {current.name}</strong>，至少需要 3 级权限才能查看名录。
          </p>
          <Button variant="tonal" onClick={() => navigate('/settings')}>
            前往设置调整权限
          </Button>
          <span className="tf-locked__hint">权限模拟仅改变阅读体验，不构成真实访问控制。</span>
        </div>
      ) : (
        <>
          <div className="tf-notice">
            <Icon name="info" size={15} />
            {access === 'roster'
              ? '当前为名录模式：可查看单位名称与人员名单，行动记录、装备与战术细节需要 4 级权限。'
              : '当前为完整档案模式：可查看行动记录、装备与人员状态。'}
          </div>

          <div className="tf-grid">
            {visible.map((taskforce) => (
              <article className="tf-card" key={taskforce.id}>
                <div className="tf-card__top">
                  <span className="tf-card__id">{taskforce.name}</span>
                  <span className="tf-card__status">{taskforce.status}</span>
                </div>
                <h2>{taskforce.nickname}</h2>
                <p className="tf-card__nickname">{taskforce.alias}</p>
                <p className="tf-card__motto">{taskforce.motto}</p>
                <p className="tf-card__role">{taskforce.role}</p>

                <div className="tf-card__meta">
                  <span>
                    <Icon name="folder" size={13} /> {taskforce.base}
                  </span>
                  <span>
                    <Icon name="shield" size={13} /> {CLEARANCES[taskforce.clearance].badge} 级
                  </span>
                </div>

                {access === 'full' ? (
                  <>
                    <div className="tf-block">
                      <h3>行动记录</h3>
                      <ul className="tf-ops">
                        {taskforce.operations.map((operation) => (
                          <li key={operation}>{operation}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="tf-block">
                      <h3>装备</h3>
                      <div className="tf-tags">
                        {taskforce.equipment.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </div>
                    <div className="tf-block">
                      <h3>人员名录</h3>
                      <ul className="tf-roster">
                        {taskforce.roster.map((member) => (
                          <li key={member.callsign}>
                            <code>{member.callsign}</code>
                            <span>{member.role}</span>
                            <MemberStatus status={member.status} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="tf-block">
                      <h3>人员名录</h3>
                      <ul className="tf-roster">
                        {taskforce.roster.map((member) => (
                          <li key={member.callsign}>
                            <code>{member.callsign}</code>
                            <span>{member.role}</span>
                            <MemberStatus status={member.status} />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="tf-redacted">
                      <Icon name="lock" size={16} />
                      <span>
                        部分档案受限
                        <small>行动记录与装备需 4 级权限</small>
                      </span>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>

          {hiddenCount > 0 ? (
            <p className="tf-hidden-note">
              <Icon name="lock" size={13} />
              另有 {hiddenCount} 个高权限单位未在当前等级列出。
            </p>
          ) : null}
        </>
      )}

      <footer className="tf-foot">
        <Icon name="shield" size={14} />
        <span>机动特遣队名录为同人阅读体验，不代表 SCP 基金会官方编制。</span>
      </footer>
    </div>
  );
}
