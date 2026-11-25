import { Button } from '../components/ui';
import { Logo } from '../components/Icon';
import { useDocumentTitle } from '../lib/hooks';

export function NotFound({ onHome }: { onHome: () => void }) {
  useDocumentTitle('页面不存在');
  return (
    <div className="page notfound">
      <Logo size={56} />
      <p className="notfound__code">404 / 档案未找到</p>
      <h1>这条记录不在档案中</h1>
      <p className="notfound__copy">
        页面可能已被移动，或链接中的编号有误。回到首页继续检索基金会档案。
      </p>
      <Button icon="home" onClick={onHome}>
        返回首页
      </Button>
    </div>
  );
}
