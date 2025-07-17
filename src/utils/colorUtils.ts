export const getColorClasses = (color: string, isExpanded: boolean) => {
  const colors = {
    emerald: {
      header: isExpanded ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-500',
      icon: 'text-white',
      text: 'text-white',
      chevron: 'text-emerald-100',
      content: 'bg-emerald-50/50'
    },
    orange: {
      header: isExpanded ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-orange-400 to-orange-500',
      icon: 'text-white',
      text: 'text-white',
      chevron: 'text-orange-100',
      content: 'bg-orange-50/50'
    },
    blue: {
      header: isExpanded ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-blue-400 to-blue-500',
      icon: 'text-white',
      text: 'text-white',
      chevron: 'text-blue-100',
      content: 'bg-blue-50/50'
    },
    yellow: {
      header: isExpanded ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-500',
      icon: 'text-white',
      text: 'text-white',
      chevron: 'text-yellow-100',
      content: 'bg-yellow-50/50'
    },
    red: {
      header: isExpanded ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-red-400 to-red-500',
      icon: 'text-white',
      text: 'text-white',
      chevron: 'text-red-100',
      content: 'bg-red-50/50'
    }
  };
  return colors[color as keyof typeof colors] || colors.emerald;
};
