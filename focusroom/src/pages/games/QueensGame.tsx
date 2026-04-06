import React, { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, CheckSquare, Clock, Crown, Lightbulb, RotateCcw, Trophy, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Sidebar } from '../../components/Sidebar'

const REGION_COLORS = [
  'bg-blue-600/80',
  'bg-emerald-600/80',
  'bg-purple-600/80',
  'bg-amber-500/80',
  'bg-rose-600/80',
  'bg-cyan-600/80',
  'bg-fuchsia-600/80',
  'bg-orange-600/80'
]

const PUZZLES = [
  {
    size: 5,
    regions: [
      [0, 0, 1, 1, 1],
      [0, 2, 2, 1, 1],
      [0, 2, 3, 3, 1],
      [4, 4, 4, 3, 3],
      [4, 4, 4, 4, 3]
    ]
  },
  {
    size: 6,
    regions: [
      [0, 0, 0, 1, 1, 2],
      [0, 3, 0, 1, 2, 2],
      [3, 3, 3, 1, 4, 2],
      [5, 5, 3, 1, 4, 4],
      [5, 5, 5, 4, 4, 4],
      [5, 5, 5, 5, 5, 4]
    ]
  }
]

const getQueensSolution = (regions: number[][], SIZE: number) => {
  let temp = Array(SIZE).fill(null).map(()=>Array(SIZE).fill(''))
  let rowQ = Array(SIZE).fill(0)
  let colQ = Array(SIZE).fill(0)
  let regQ = Array(SIZE).fill(0)

  const isValid = (r: number, c: number) => {
    if(rowQ[r] > 0 || colQ[c] > 0 || regQ[regions[r][c]] > 0) return false
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
    for(let [dr,dc] of dirs){
      let nr=r+dr, nc=c+dc
      if(nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && temp[nr][nc]==='Q') return false
    }
    return true
  }

  const solve = (r: number): boolean => {
    if (r === SIZE) return true
    for(let c=0; c<SIZE; c++) {
      if (isValid(r, c)) {
        temp[r][c] = 'Q'
        rowQ[r]++; colQ[c]++; regQ[regions[r][c]]++;
        if (solve(r+1)) return true
        temp[r][c] = ''
        rowQ[r]--; colQ[c]--; regQ[regions[r][c]]--;
      }
    }
    return false
  }
  solve(0)
  
  for(let r=0; r<SIZE; r++) {
    for(let c=0; c<SIZE; c++) {
      if (temp[r][c] !== 'Q') temp[r][c] = 'X'
    }
  }
  return temp
}

export function QueensGame() {
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const puzzle = PUZZLES[puzzleIndex]
  const SIZE = puzzle.size
  const solution = useMemo(() => getQueensSolution(puzzle.regions, SIZE), [puzzleIndex])
  
  const [board, setBoard] = useState<string[][]>(
    Array(SIZE).fill(null).map(() => Array(SIZE).fill(''))
  )
  const [hintedCell, setHintedCell] = useState<[number, number] | null>(null)
  
  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isShowingSolution, setIsShowingSolution] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (isPlaying) {
      timer = setInterval(() => {
        setTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isPlaying])

  const handleCellClick = (r: number, c: number, e?: React.MouseEvent) => {
    if (!isPlaying) return
    if (e) e.preventDefault()

    const newBoard = board.map(row => [...row])
    if (e?.type === 'contextmenu') {
      newBoard[r][c] = board[r][c] === 'X' ? '' : 'X'
    } else {
      if (board[r][c] === '') newBoard[r][c] = 'X'
      else if (board[r][c] === 'X') newBoard[r][c] = 'Q'
      else newBoard[r][c] = ''
    }
    setBoard(newBoard)
  }

  const loadNewGame = () => {
    const nextIdx = (puzzleIndex + 1) % PUZZLES.length
    const nextSize = PUZZLES[nextIdx].size
    setPuzzleIndex(nextIdx)
    setBoard(Array(nextSize).fill(null).map(() => Array(nextSize).fill('')))
    setHintedCell(null)
    setIsShowingSolution(false)
    setTime(0)
    setIsPlaying(true)
  }

  const resetCurrent = () => {
    setBoard(Array(SIZE).fill(null).map(() => Array(SIZE).fill('')))
    setHintedCell(null)
    setIsShowingSolution(false)
    setTime(0)
    setIsPlaying(true)
  }

  const checkWin = () => {
    let qCount = 0
    let rowQ = Array(SIZE).fill(0)
    let colQ = Array(SIZE).fill(0)
    let regionQ = Array(SIZE).fill(0)
    
    for(let r=0; r<SIZE; r++) {
      for(let c=0; c<SIZE; c++) {
        if (board[r][c] === 'Q') {
          qCount++
          rowQ[r]++
          colQ[c]++
          regionQ[puzzle.regions[r][c]]++

          const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
          for (let [dr, dc] of dirs) {
             let nr = r + dr, nc = c + dc
             if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && board[nr][nc] === 'Q') {
               return false
             }
          }
        }
      }
    }
    if (qCount !== SIZE) return false
    for(let i=0; i<SIZE; i++) {
       if (rowQ[i] !== 1 || colQ[i] !== 1 || regionQ[i] !== 1) return false
    }
    return true
  }

  useEffect(() => {
    if (checkWin() && !isShowingSolution) {
      setIsPlaying(false)
    }
  }, [board])

  const giveHint = () => {
    if (!isPlaying || time < 10) return
    const candidates: [number, number][] = []
    
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (solution[r][c] === 'Q' && board[r][c] !== 'Q') {
           candidates.push([r, c])
        }
      }
    }
    
    if (candidates.length > 0) {
      const [r, c] = candidates[Math.floor(Math.random() * candidates.length)]
      const newBoard = board.map(row => [...row])
      newBoard[r][c] = 'Q'
      setBoard(newBoard)
      setHintedCell([r, c])
      setTimeout(() => setHintedCell(null), 3500)
    }
  }

  const showSolution = () => {
    if (!isPlaying) return
    setBoard(solution)
    setIsShowingSolution(true)
    setIsPlaying(false)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isHintAvailable = time >= 10 && isPlaying

  return (
    <div className="flex min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <Sidebar />
      <main className="ml-72 flex w-full flex-col items-center p-8 transform-gpu">
        <header className="mb-8 flex w-full max-w-4xl items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-6 py-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link to="/arcade-mode" className="rounded-lg p-2 active:scale-95 bg-[var(--bg-elev)] hover:bg-[var(--accent-soft)] transition-all">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Queens</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-[var(--muted)] font-medium tracking-wide">
                <Clock className="w-4 h-4 text-[var(--accent)]" /> {formatTime(time)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
             <button
              onClick={giveHint}
              disabled={!isHintAvailable}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all active:scale-95 border ${
                isHintAvailable 
                ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white' 
                : 'bg-[var(--bg-elev)] text-[var(--muted)] border-[var(--border)] opacity-50 cursor-not-allowed'
              }`}
            >
              <Lightbulb className="h-4 w-4" /> {isHintAvailable ? 'Hint' : 'Hint (10s)'}
            </button>
            <button
              onClick={showSolution}
              disabled={!isPlaying}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all active:scale-95 border ${
                isPlaying
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/50 hover:bg-emerald-500 hover:text-white dark:text-emerald-400'
                : 'bg-[var(--bg-elev)] text-[var(--muted)] border-[var(--border)] opacity-50 cursor-not-allowed'
              }`}
            >
              <CheckSquare className="h-4 w-4" /> Solve
            </button>
             <button
              onClick={resetCurrent}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm font-bold transition-all active:scale-95 hover:bg-[var(--card)] shadow-sm"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={loadNewGame}
              className="px-5 py-2 bg-[var(--text)] text-[var(--bg)] font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
               New Game
            </button>
          </div>
        </header>

        <div className="relative flex flex-col items-center rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl shadow-[var(--card-shadow)]">
          {!isPlaying && checkWin() && !isShowingSolution && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-[var(--bg)]/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
               <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-full shadow-2xl mb-6">
                 <Trophy className="h-16 w-16 text-yellow-500" />
              </div>
              <h2 className="font-display text-4xl font-extrabold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">Complete!</h2>
              <p className="mb-8 mt-2 text-lg text-[var(--muted)] font-semibold tracking-wide">Time Cleared: {formatTime(time)}</p>
              <button
                onClick={loadNewGame}
                className="rounded-xl bg-[var(--accent)] px-8 py-4 font-bold text-lg text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--accent)]/30"
              >
                Play Next Level
              </button>
            </div>
          )}

          <div 
            className="grid gap-[2px] border-4 border-slate-900 bg-slate-900 rounded-xl overflow-hidden shadow-inner"
            style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const regionId = puzzle.regions[r][c]
                const colorClass = REGION_COLORS[regionId % REGION_COLORS.length]
                const isHinted = hintedCell?.[0] === r && hintedCell?.[1] === c
                
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`h-14 w-14 sm:h-20 sm:w-20 flex items-center justify-center cursor-pointer transition-all hover:brightness-125 border border-white/5 active:scale-95 ${colorClass} ${
                      isHinted ? 'z-20 scale-105 shadow-xl animate-pulse ring-4 ring-green-400 outline outline-4 outline-green-300 rounded-md bg-green-500/80 blend-normal' : ''
                    }`}
                    onClick={(e) => handleCellClick(r, c, e)}
                    onContextMenu={(e) => handleCellClick(r, c, e)}
                  >
                    {cell === 'Q' && <div className="animate-in zoom-in duration-200"><Crown className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] fill-yellow-400" /></div>}
                    {cell === 'X' && <X className="w-6 h-6 sm:w-8 sm:h-8 text-black opacity-30 drop-shadow-sm" />}
                  </div>
                )
              })
            )}
          </div>

          <p className="mt-8 text-center text-sm font-semibold text-[var(--muted)] max-w-md leading-relaxed">
            {isShowingSolution 
               ? "Showing solution. Click New Game to try another!" 
               : `Exactly 1 Queen per row, column, and colored region. Queens cannot touch even diagonally. Left click cycles (X -> Queen). Right click cycles (X). ${isHintAvailable ? "You can now use a Hint!" : `Wait ${10 - time > 0 ? 10 - time : 0} seconds for a Hint.`}`
            }
          </p>
        </div>
      </main>
    </div>
  )
}
