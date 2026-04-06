import React, { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, CheckSquare, Clock, Lightbulb, RotateCcw, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Sidebar } from '../../components/Sidebar'

const PUZZLES = [
  [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0],
  ],
  [
    [1, 0, 0, 4, 8, 9, 0, 0, 6],
    [7, 3, 0, 0, 0, 0, 0, 4, 0],
    [0, 0, 0, 0, 0, 1, 2, 9, 5],
    [0, 0, 7, 1, 2, 0, 6, 0, 0],
    [5, 0, 0, 7, 0, 3, 0, 0, 8],
    [0, 0, 6, 0, 9, 5, 7, 0, 0],
    [9, 1, 4, 6, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 0, 3, 7],
    [8, 0, 0, 5, 1, 2, 0, 0, 4],
  ]
]

const copyBoard = (board: number[][]) => board.map((row) => [...row])

const checkValidation = (board: number[][], r: number, c: number, val: number) => {
  if (val === 0) return true
  for (let i = 0; i < 9; i++) {
    if (i !== c && board[r][i] === val) return false
    if (i !== r && board[i][c] === val) return false
  }
  const boxR = Math.floor(r / 3) * 3
  const boxC = Math.floor(c / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const curR = boxR + i
      const curC = boxC + j
      if ((curR !== r || curC !== c) && board[curR][curC] === val) return false
    }
  }
  return true
}

const getSudokuSolution = (initialBoard: number[][]) => {
  const board = copyBoard(initialBoard)
  const solve = () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let v = 1; v <= 9; v++) {
            if (checkValidation(board, r, c, v)) {
              board[r][c] = v
              if (solve()) return true
              board[r][c] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }
  solve()
  return board
}

export function SudokuGame() {
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const initialBoard = PUZZLES[puzzleIndex]
  const solution = useMemo(() => getSudokuSolution(initialBoard), [initialBoard])
  
  const [board, setBoard] = useState(copyBoard(initialBoard))
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
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

  const handleCellClick = (r: number, c: number) => {
    if (initialBoard[r][c] === 0 && isPlaying) {
      setSelectedCell([r, c])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell || !isPlaying) return
    const [r, c] = selectedCell
    const key = e.key

    if (key >= '1' && key <= '9') {
      const newBoard = copyBoard(board)
      newBoard[r][c] = parseInt(key, 10)
      setBoard(newBoard)
    } else if (key === 'Backspace' || key === 'Delete') {
      const newBoard = copyBoard(board)
      newBoard[r][c] = 0
      setBoard(newBoard)
    }
  }

  const loadNewGame = () => {
    const nextIdx = (puzzleIndex + 1) % PUZZLES.length
    setPuzzleIndex(nextIdx)
    setBoard(copyBoard(PUZZLES[nextIdx]))
    setSelectedCell(null)
    setHintedCell(null)
    setIsShowingSolution(false)
    setTime(0)
    setIsPlaying(true)
  }

  const resetCurrent = () => {
    setBoard(copyBoard(initialBoard))
    setSelectedCell(null)
    setHintedCell(null)
    setIsShowingSolution(false)
    setTime(0)
    setIsPlaying(true)
  }

  const checkWin = () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0 || !checkValidation(board, r, c, board[r][c])) {
          return false
        }
      }
    }
    return true
  }

  useEffect(() => {
    if (checkWin() && !isShowingSolution) {
      setIsPlaying(false)
      setSelectedCell(null)
    }
  }, [board])

  const giveHint = () => {
    if (!isPlaying || time < 10) return
    const candidates: [number, number][] = []
    
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0 || (board[r][c] !== solution[r][c])) {
           candidates.push([r, c])
        }
      }
    }
    
    if (candidates.length > 0) {
      const [r, c] = candidates[Math.floor(Math.random() * candidates.length)]
      const newBoard = copyBoard(board)
      newBoard[r][c] = solution[r][c]
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
    setSelectedCell(null)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isHintAvailable = time >= 10 && isPlaying

  return (
    <div
      className="flex min-h-screen w-full bg-[var(--bg)] text-[var(--text)] outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <Sidebar />
      <main className="ml-72 flex w-full flex-col items-center p-8 transform-gpu">
        <header className="mb-8 flex w-full max-w-4xl items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-6 py-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link to="/arcade-mode" className="rounded-lg p-2 active:scale-95 bg-[var(--bg-elev)] hover:bg-[var(--accent-soft)] transition-all">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Sudoku</h1>
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

          <div className="grid grid-cols-9 overflow-hidden rounded-xl border-[3px] border-[var(--text)] bg-[var(--text)] gap-px shadow-inner">
            {board.map((row, rIndex) =>
              row.map((cell, cIndex) => {
                const isInitial = initialBoard[rIndex][cIndex] !== 0
                const isSelected = selectedCell?.[0] === rIndex && selectedCell?.[1] === cIndex
                const isRightBorder = (cIndex + 1) % 3 === 0 && cIndex !== 8
                const isBottomBorder = (rIndex + 1) % 3 === 0 && rIndex !== 8
                const isHinted = hintedCell?.[0] === rIndex && hintedCell?.[1] === cIndex
                
                let isWrong = false
                if (cell !== 0 && !isInitial) {
                  isWrong = !checkValidation(board, rIndex, cIndex, cell)
                }

                let cellColor = 'bg-[var(--card)]'
                if (isHinted) cellColor = 'bg-green-400/40 z-20 animate-pulse border-2 border-green-500 rounded-md scale-105 shadow-xl'
                else if (isSelected) cellColor = 'bg-[var(--accent-soft)] scale-105 z-10 rounded-md shadow-lg outline outline-2 outline-[var(--accent)]'
                else if (isWrong) cellColor = 'bg-red-500/20'
                else if (!isInitial) cellColor = 'bg-[var(--card)] hover:bg-[var(--bg-elev)]'

                return (
                  <div
                    key={`${rIndex}-${cIndex}`}
                    onClick={() => handleCellClick(rIndex, cIndex)}
                    className={`
                      flex h-12 w-12 cursor-pointer items-center justify-center text-2xl font-bold transition-all sm:h-16 sm:w-16
                      ${isRightBorder ? 'border-r-4 border-r-[var(--text)]' : ''}
                      ${isBottomBorder ? 'border-b-4 border-b-[var(--text)]' : ''}
                      ${cellColor}
                    `}
                  >
                    <span
                      className={`
                      ${isInitial ? 'text-[var(--text)] opacity-90' : (isWrong ? 'text-red-500' : 'text-[var(--accent)]')}
                      ${isHinted ? 'text-green-600 dark:text-green-400 drop-shadow-md' : ''}
                    `}
                    >
                      {cell !== 0 ? cell : ''}
                    </span>
                  </div>
                )
              }),
            )}
          </div>

          <p className="mt-8 text-center text-sm font-semibold text-[var(--muted)]">
            {isShowingSolution 
               ? "Showing solution. Click New Game to try another!" 
               : `Use Keyboard 1-9 to fill squares. ${isHintAvailable ? "You can now use a Hint!" : `Wait ${10 - time > 0 ? 10 - time : 0} seconds for a Hint.`}`
            }
          </p>
        </div>
      </main>
    </div>
  )
}
