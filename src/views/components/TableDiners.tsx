import { getInitials } from '../../models/data/mockData';

interface Diner {
  nombre: string;
  color: string;
}

interface TableDinersProps {
  diners: Diner[];
  currentUserName?: string;
}

export function TableDiners({ diners, currentUserName }: TableDinersProps) {
  return (
    <div className="flex items-center gap-2">
      {diners.map((diner, index) => {
        const isCurrentUser = diner.nombre === currentUserName;
        return (
          <div
            key={index}
            className={`relative group ${isCurrentUser ? 'ring-2 ring-orange-500' : ''}`}
            style={{ borderRadius: '50%' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md"
              style={{ backgroundColor: diner.color }}
            >
              {getInitials(diner.nombre)}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {diner.nombre}
              {isCurrentUser && ' (tú)'}
            </div>
          </div>
        );
      })}
    </div>
  );
}