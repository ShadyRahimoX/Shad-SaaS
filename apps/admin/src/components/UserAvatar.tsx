import React from 'react';

export interface UserAvatarProps {
  user: {
    username: string;
    firstName?: string | null;
    avatarUrl?: string | null;
    vipColor?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
};

function getVipColorClasses(vipColor?: string): string {
  const normalized = (vipColor || '').toUpperCase();
  switch (normalized) {
    case '#FFD700':
    case '#F59E0B':
    case '#EAB308':
      return 'bg-amber-500 text-white border-amber-400/40';
    case '#C0C0C0':
    case '#94A3B8':
    case '#CBD5E1':
      return 'bg-slate-400 text-white border-slate-300/40';
    case '#CD7F32':
    case '#D97706':
    case '#B45309':
      return 'bg-orange-600 text-white border-orange-500/40';
    case '#3B82F6':
      return 'bg-blue-600 text-white border-blue-500/40';
    case '#10B981':
      return 'bg-emerald-600 text-white border-emerald-500/40';
    case '#8B5CF6':
      return 'bg-violet-600 text-white border-violet-500/40';
    case '#6B7280':
    default:
      return 'bg-gray-500 text-white border-gray-400/40';
  }
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md' }) => {
  const sizeClass = SIZE_CLASSES[size];
  const rawInitial =
    (user.firstName && user.firstName.trim().charAt(0)) ||
    (user.username && user.username.trim().charAt(0)) ||
    'U';
  const initial = rawInitial.toUpperCase();

  if (user.avatarUrl) {
    return (
      <div
        data-user-avatar
        className={`${sizeClass} rounded-full overflow-hidden shrink-0 border border-border flex items-center justify-center bg-muted`}
      >
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const colorClass = getVipColorClasses(user.vipColor);

  return (
    <div
      data-user-avatar
      data-vip-color={user.vipColor || '#6B7280'}
      className={`${sizeClass} ${colorClass} rounded-full shrink-0 border flex items-center justify-center font-black select-none shadow-2xs`}
    >
      <span>{initial}</span>
    </div>
  );
};

export default UserAvatar;
