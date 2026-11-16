import { Link } from 'react-router-dom';
import '@/pages/bitbot-crowdfunding.css';
import './BotSwitch.css';

type Bot = 'bitbot' | 'minibit';

/**
 * Top of the /bitbot pages: all bots in the BitBot series live under
 * bitpopart.com/bitbot, so the top of each page is split in two tiles.
 */
export function BotSwitch({ active }: { active: Bot }) {
  const tiles: {
    id: Bot;
    to: string;
    name: string;
    line: string;
    img: string;
    alt: string;
  }[] = [
    {
      id: 'bitbot',
      to: '/bitbot',
      name: 'BitBot',
      line: 'The pocket bot with all the features. Crowdfunding.',
      img: '/bitbot/crowdfunding-assets/542397c8b4.jpg',
      alt: 'BitBot, the pocket bot with one big eye',
    },
    {
      id: 'minibit',
      to: '/bitbot/minibit',
      name: 'MiniBit',
      line: 'The 5.2 cm keychain bot. Similar apps, simpler.',
      img: '/bitbot/minibit/minibit-front.webp',
      alt: 'MiniBit, a small black block with pixel eyes',
    },
  ];

  return (
    <nav className="bbsw" aria-label="BitBot series">
      <div className="bbsw-in">
        {tiles.map((t) => (
          <Link
            key={t.id}
            to={t.to}
            className={`bbsw-tile bbsw-${t.id}${active === t.id ? ' on' : ''}`}
            aria-current={active === t.id ? 'page' : undefined}
          >
            <img src={t.img} alt={t.alt} width={96} height={96} />
            <span className="bbsw-txt">
              <span className="bbsw-tag">{active === t.id ? 'You are here' : 'Open'}</span>
              <span className="bbsw-name">{t.name}</span>
              <span className="bbsw-line">{t.line}</span>
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
