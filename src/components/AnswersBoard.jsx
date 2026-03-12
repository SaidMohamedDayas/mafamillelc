import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AnswerItem({ answer, index, onToggle, compact }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onToggle(index)}
      className={`group relative grid w-full items-center overflow-hidden rounded-r-2xl border border-yellow-400/95 bg-yellow-400 text-left transition ${
        compact ? 'grid-cols-[60px_1fr_64px]' : 'grid-cols-[80px_1fr_80px]'
      } ${
        answer.revealed
          ? 'shadow-[0_0_20px_rgba(250,204,21,0.35)]'
          : 'hover:brightness-95'
      }`}
    >
      <span
        className={`flex h-full items-center justify-center bg-black font-display font-bold text-yellow-400 ${
          compact ? 'text-xl' : 'text-3xl'
        }`}
      >
        {index + 1}
      </span>
      <div className={`relative ${compact ? 'px-3 py-2 md:px-4 md:py-2' : 'px-4 py-3 md:px-6 md:py-4'}`}>
        {answer.revealed ? (
          <span className={`font-extrabold text-black ${compact ? 'text-base md:text-lg' : 'text-lg md:text-2xl'}`}>
            {answer.text}
          </span>
        ) : (
          <span className={`block bg-black ${compact ? 'h-6 w-32 md:h-7 md:w-40' : 'h-8 w-44 md:h-9 md:w-56'}`} />
        )}
      </div>
      <div
        className={`flex h-full items-center justify-center pr-2 font-display font-bold text-black ${
          compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
        }`}
      >
        {answer.revealed ? answer.points : '?'}
      </div>
    </motion.button>
  );
}

export function AnswersBoard({ question, answers, revealedTotal, onToggleAnswer, compact = false }) {
  return (
    <Card
      className={`border border-white/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_45%,rgba(44,63,150,0.2))] shadow-[0_20px_45px_rgba(0,0,0,0.35)] ${
        compact ? 'px-2 pb-2 pt-3' : 'px-2 pb-2 pt-4'
      }`}
    >
      <CardHeader className={compact ? 'space-y-3 pb-3' : 'space-y-4 pb-4'}>
        <div className="flex justify-center">
          <Badge className="w-fit bg-[#2c3154] text-yellow-300 shadow-none">Total revele: {revealedTotal}</Badge>
        </div>
        <CardTitle className={`text-center leading-snug text-slate-100 ${compact ? 'text-2xl md:text-4xl' : 'text-3xl md:text-5xl'}`}>
          {question}
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'space-y-2' : 'space-y-3'}>
        {answers.map((answer, index) => (
          <AnswerItem key={index} answer={answer} index={index} onToggle={onToggleAnswer} compact={compact} />
        ))}
      </CardContent>
    </Card>
  );
}
