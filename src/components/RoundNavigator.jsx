import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function RoundNavigator({ currentIndex, total, onPrevious, onNext, onSelect }) {
  return (
    <div className="stage-frame space-y-3 rounded-2xl p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="secondary" onClick={onPrevious} disabled={currentIndex === 0}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="secondary" onClick={onNext} disabled={currentIndex === total - 1}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <Badge>
          Manche {currentIndex + 1} / {total}
        </Badge>
      </div>
      <div className="grid grid-cols-6 gap-2 md:grid-cols-10 xl:grid-cols-12">
        {Array.from({ length: total }, (_, index) => (
          <Button
            key={index}
            size="sm"
            variant={index === currentIndex ? 'accent' : 'secondary'}
            onClick={() => onSelect(index)}
            className="min-w-0 font-display"
          >
            {index + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}
