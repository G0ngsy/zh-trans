import logo from '../assets/hanyu-wordmark.png';
interface HeaderProps { onLogoClick: () => void }
export default function Header({ onLogoClick }: HeaderProps) {
  return <header className="site-header"><div className="header-inner">
    <button onClick={onLogoClick} className="brand" aria-label="한어렌즈 홈"><span className="brand-wordmark"><img src={logo} alt="한어렌즈 Hanyu Lens" width="2172" height="724" /></span></button>
  </div></header>;
}
