import { Link } from 'react-router-dom';
import { BRANCH_SHORT } from '../lib/constants';
import { escapeRegExp } from '../lib/format';
import type { Branch } from '../lib/types';
import { Icon, type IconName } from './Icon';
import { IconButton } from './ui';

export interface RowEntry {
  branch: Branch;
  slug: string;
  code: string;
  title: string;
  seriesId?: string;
  firstSeen?: number;
}

function Highlight({ text, query }: { text: string; query?: string }) {
  const needle = query?.trim();
  if (!needle) return <>{text}</>;
  const pattern = new RegExp(`(${escapeRegExp(needle)})`, 'ig');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <mark key={`${part}-${index}`}>{part}</mark> : part,
      )}
    </>
  );
}

export function EntryRow({
  entry,
  showBranch,
  progress,
  cached,
  query,
  onRemove,
  removeIcon = 'trash',
  removeLabel = '移除',
}: {
  entry: RowEntry;
  showBranch?: boolean;
  progress?: number;
  cached?: boolean;
  query?: string;
  onRemove?: () => void;
  removeIcon?: IconName;
  removeLabel?: string;
}) {
  const isNew = Boolean(entry.firstSeen && entry.firstSeen > 0);
  return (
    <div className="entry-row">
      <Link className="entry-row__main" to={`/read/${entry.branch}/${entry.slug}`}>
        <span className="entry-row__code">
          {showBranch ? <span className="entry-row__branch">{BRANCH_SHORT[entry.branch]}</span> : null}
          <Highlight text={entry.code} query={query} />
        </span>
        <span className="entry-row__body">
          <span className="entry-row__title">
            <Highlight text={entry.title} query={query} />
            {isNew ? <span className="entry-row__new">NEW</span> : null}
          </span>
          <span className="entry-row__meta">
            {cached ? (
              <span className="entry-row__flag">
                <Icon name="download-done" size={13} /> 已离线
              </span>
            ) : null}
            {typeof progress === 'number' && progress > 0 ? (
              <span className="entry-row__flag">{Math.round(progress)}%</span>
            ) : null}
          </span>
        </span>
        <Icon name="chevron-right" size={17} className="entry-row__chevron" />
        {typeof progress === 'number' && progress > 0 ? (
          <span className="entry-row__progress" style={{ width: `${Math.max(2, progress)}%` }} />
        ) : null}
      </Link>
      {onRemove ? (
        <IconButton
          icon={removeIcon}
          label={removeLabel}
          className="entry-row__remove"
          onClick={onRemove}
        />
      ) : null}
    </div>
  );
}
