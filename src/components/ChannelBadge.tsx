import { clsx } from 'clsx';

type Props = {
  channel: 'whatsapp' | 'sms' | 'email' | 'rcs';
  className?: string;
};

const LABELS: Record<Props['channel'], string> = {
  whatsapp: '💬 WhatsApp',
  sms:      '📱 SMS',
  email:    '✉️ Email',
  rcs:      '🌐 RCS',
};

export default function ChannelBadge({ channel, className }: Props) {
  return (
    <span className={clsx('badge', `channel-${channel}`, className)}>
      {LABELS[channel]}
    </span>
  );
}
