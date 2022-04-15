import { expect } from "chai";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TicTacToe } from "../target/types/tic_tac_toe";

async function play(
  program,
  game,
  player,
  tile,
  expectedTurn,
  expectedState,
  expectedBoard
) {
  await program.methods
    .play(tile)
    .accounts({ game: game.publicKey, player: player.publicKey })
    .signers(player instanceof (anchor.Wallet as any) ? [] : [player])
    .rpc();
  const gameState = await program.account.game.fetch(game.publicKey);

  expect(gameState.turn).to.equal(expectedTurn);
  expect(gameState.state).to.eql(expectedState);
  expect(gameState.board).to.eql(expectedBoard);
}

describe("tic-tac-toe", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.TicTacToe as Program<TicTacToe>;
  let gameKeypair;
  let playerOne;
  let playerTwo;

  beforeEach(async () => {
    gameKeypair = anchor.web3.Keypair.generate();
    playerOne = program.provider.wallet;
    playerTwo = anchor.web3.Keypair.generate();
    await program.methods
      .setupGame(playerTwo.publicKey)
      .accounts({
        game: gameKeypair.publicKey,
        playerOne: playerOne.publicKey,
      })
      .signers([gameKeypair])
      .rpc();
  });

  it("setup game!", async () => {
    const gameState = await program.account.game.fetch(gameKeypair.publicKey);
    expect(gameState.turn).to.equal(1);
    expect(gameState.players).to.eql([
      playerOne.publicKey,
      playerTwo.publicKey,
    ]);
    expect(gameState.state).to.eql({ active: {} });
    expect(gameState.board).to.eql([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
  });

  it("player one wins", async () => {
    await play(
      program,
      gameKeypair,
      playerOne,
      { row: 0, column: 2 },
      2,
      {
        active: {},
      },
      [
        [null, null, { o: {} }],
        [null, null, null],
        [null, null, null],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerTwo,
      { row: 2, column: 2 },
      3,
      {
        active: {},
      },
      [
        [null, null, { o: {} }],
        [null, null, null],
        [null, null, { x: {} }],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerOne,
      { row: 2, column: 0 },
      4,
      {
        active: {},
      },
      [
        [null, null, { o: {} }],
        [null, null, null],
        [{ o: {} }, null, { x: {} }],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerTwo,
      { row: 1, column: 1 },
      5,
      {
        active: {},
      },
      [
        [null, null, { o: {} }],
        [null, { x: {} }, null],
        [{ o: {} }, null, { x: {} }],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerOne,
      { row: 0, column: 0 },
      6,
      {
        active: {},
      },
      [
        [{ o: {} }, null, { o: {} }],
        [null, { x: {} }, null],
        [{ o: {} }, null, { x: {} }],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerTwo,
      { row: 0, column: 1 },
      7,
      {
        active: {},
      },
      [
        [{ o: {} }, { x: {} }, { o: {} }],
        [null, { x: {} }, null],
        [{ o: {} }, null, { x: {} }],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerOne,
      { row: 1, column: 0 },
      7,
      {
        won: { winner: playerOne.publicKey },
      },
      [
        [{ o: {} }, { x: {} }, { o: {} }],
        [{ o: {} }, { x: {} }, null],
        [{ o: {} }, null, { x: {} }],
      ]
    );
  });

  it("ties", async () => {
    await play(
      program,
      gameKeypair,
      playerOne,
      { row: 1, column: 0 },
      2,
      {
        active: {},
      },
      [
        [null, null, null],
        [{ o: {} }, null, null],
        [null, null, null],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerTwo,
      { row: 2, column: 1 },
      3,
      {
        active: {},
      },
      [
        [null, null, null],
        [{ o: {} }, null, null],
        [null, { x: {} }, null],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerOne,
      { row: 1, column: 1 },
      4,
      {
        active: {},
      },
      [
        [null, null, null],
        [{ o: {} }, { o: {} }, null],
        [null, { x: {} }, null],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerTwo,
      { row: 1, column: 2 },
      5,
      {
        active: {},
      },
      [
        [null, null, null],
        [{ o: {} }, { o: {} }, { x: {} }],
        [null, { x: {} }, null],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerOne,
      { row: 2, column: 2 },
      6,
      {
        active: {},
      },
      [
        [null, null, null],
        [{ o: {} }, { o: {} }, { x: {} }],
        [null, { x: {} }, { o: {} }],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerTwo,
      { row: 0, column: 0 },
      7,
      {
        active: {},
      },
      [
        [{ x: {} }, null, null],
        [{ o: {} }, { o: {} }, { x: {} }],
        [null, { x: {} }, { o: {} }],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerOne,
      { row: 0, column: 2 },
      8,
      {
        active: {},
      },
      [
        [{ x: {} }, null, { o: {} }],
        [{ o: {} }, { o: {} }, { x: {} }],
        [null, { x: {} }, { o: {} }],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerTwo,
      { row: 2, column: 0 },
      9,
      {
        active: {},
      },
      [
        [{ x: {} }, null, { o: {} }],
        [{ o: {} }, { o: {} }, { x: {} }],
        [{ x: {} }, { x: {} }, { o: {} }],
      ]
    );
    await play(
      program,
      gameKeypair,
      playerOne,
      { row: 0, column: 1 },
      9,
      {
        tie: {},
      },
      [
        [{ x: {} }, { o: {} }, { o: {} }],
        [{ o: {} }, { o: {} }, { x: {} }],
        [{ x: {} }, { x: {} }, { o: {} }],
      ]
    );
  });
});
