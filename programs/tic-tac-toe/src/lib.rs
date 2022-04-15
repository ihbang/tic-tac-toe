use anchor_lang::prelude::*;
use num_derive::*;
use num_traits::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod tic_tac_toe {
    use super::*;

    pub fn setup_game(ctx: Context<SetupGame>, player_two: Pubkey) -> Result<()> {
        ctx.accounts
            .game
            .start([ctx.accounts.player_one.key(), player_two])
    }
}

#[derive(
    AnchorDeserialize, AnchorSerialize, Clone, Copy, PartialEq, Eq, FromPrimitive, ToPrimitive,
)]
pub enum Sign {
    O,
    X,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Eq)]
pub enum GameState {
    Active,
    Tie,
    Won { winner: Pubkey },
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct Tile {
    row: u8,
    column: u8,
}

#[account]
pub struct Game {
    // space reference: https://book.anchor-lang.com/chapter_5/space.html
    // Option<T>: 1 + space(T)
    // Enum: 1 + Largest variant size
    players: [Pubkey; 2],          // 32 * 2
    turn: u8,                      // 1
    board: [[Option<Sign>; 3]; 3], // (1 + 1) * 3 * 3
    state: GameState,              // 1 + 32
}

impl Game {
    pub const MAXIMUM_SIZE: usize = 32 * 2 + 1 + (1 + 1) * 3 * 3 + 1 + 32;

    pub fn is_active(&self) -> bool {
        self.state == GameState::Active
    }

    pub fn current_player_index(&self) -> usize {
        ((self.turn - 1) % 2).into()
    }

    pub fn current_player(&self) -> Pubkey {
        self.players[self.current_player_index()]
    }

    pub fn current_player_sign(&self) -> Option<Sign> {
        Sign::from_usize(self.current_player_index())
    }

    pub fn start(&mut self, players: [Pubkey; 2]) -> Result<()> {
        require_eq!(self.turn, 0, TicTacToeError::GameAlreadyStarted);
        require_eq!(self.players.len(), 2, TicTacToeError::NotEnoughPlayer);
        self.players = players;
        self.state = GameState::Active;
        self.turn = 1;
        Ok(())
    }

    pub fn play(&mut self, tile: Tile) -> Result<()> {
        require!(self.is_active(), TicTacToeError::GameNotActive);

        match &tile {
            tile @ Tile {
                row: 0..=2,
                column: 0..=2,
            } => {
                let (row_num, col_num) = (tile.row as usize, tile.column as usize);
                match self.board[row_num][col_num] {
                    Some(_) => return Err(TicTacToeError::TileAlreadySet.into()),
                    None => self.board[row_num][col_num] = self.current_player_sign(),
                }
            }
            _ => return Err(TicTacToeError::TileOutOfBounds.into()),
        }

        self.update_state(tile);
        if self.is_active() {
            self.turn += 1;
        }

        Ok(())
    }

    pub fn is_winning_trio(&self, trio: [(usize, usize); 3]) -> bool {
        let [first, second, third] = trio;
        self.board[first.0][first.1].is_some()
            && self.board[first.0][first.1] == self.board[second.0][second.1]
            && self.board[first.0][first.1] == self.board[third.0][third.1]
    }

    pub fn update_state(&mut self, last_tile: Tile) {
        let (row_num, col_num) = (last_tile.row as usize, last_tile.column as usize);
        if self.is_winning_trio([(row_num, 0), (row_num, 1), (row_num, 2)])
            || self.is_winning_trio([(0, col_num), (1, col_num), (2, col_num)])
            || self.is_winning_trio([(0, 0), (1, 1), (2, 2)])
            || self.is_winning_trio([(0, 2), (1, 1), (2, 0)])
        {
            self.state = GameState::Won {
                winner: self.current_player(),
            };
        } else if self.turn == 9 {
            self.state = GameState::Tie;
        }
    }
}

#[error_code]
pub enum TicTacToeError {
    #[msg("The game has already been started")]
    GameAlreadyStarted,
    #[msg("There is no empty space for new player")]
    GameAlreadyFull,
    #[msg("The game needs 2 players to start")]
    NotEnoughPlayer,
    #[msg("You are not a game player")]
    PlayerNotInGame,
    #[msg("The game is not active")]
    GameNotActive,
    #[msg("Unable to play out of the board")]
    TileOutOfBounds,
    #[msg("The tile is already set")]
    TileAlreadySet,
}

#[derive(Accounts)]
pub struct SetupGame<'info> {
    #[account(init, payer = player_one, space = 8 + Game::MAXIMUM_SIZE)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player_one: Signer<'info>,
    pub system_program: Program<'info, System>,
}
