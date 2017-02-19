import React from 'react';

require('./App.css');

const cardsCount = 8;

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			deck1: null,
			deck2: null,
			selected1: null,
			selected2: null,
			matched: {},
			turns: 0,
			highscores: {}
		};
	}

	componentDidMount() {
		this.start();
		firebase.database().ref('scores').on('value', (snapshot) => {
			const vals = snapshot.val();
			if(vals) {
				this.setState({highscores: vals});
			}
		});
	}

	componentDidUpdate() {
		if(this.state.selected1 && this.state.selected1 && this.state.selected2) {
			const turns = ++this.state.turns;
			if(Object.keys(this.state.matched).length === cardsCount) {
				const name = prompt("Submit score. Your name:");
				if(name) {
					this.submitScore(name, turns);
				}
			}
			setTimeout(() => {
				this.setState({selected1: null, selected2: null, turns });
			}, 500)
		}
	}

	start() {
		Promise.all([this.newDeck(), this.newDeck()]).then(([one, two]) => {
			this.setState({
				deck1: one,
				deck2: two,
				selected1: null,
				selected2: null,
				matched: {},
				turns: 0
			});
		})
	}

	draw(deck) {
		return fetch(`https://deckofcardsapi.com/api/deck/${deck}/draw/?count=${cardsCount}`).then(
			resp => resp.json()
		);
	}

	newDeck() {
		return fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?cards=AS,2S,KS,AD,2D,KD,AC,2C')
			.then(resp => resp.json())
			.then(
				deck => this.draw(deck.deck_id)
			)
	}

	renderBack(stack, card) {
		const color = stack === 1 ? 'blue' : 'red';
		return <span key={card.code} onClick={e => this.onCardClick(stack, card)} style={{backgroundColor: color, width: 100, height: 138, display: 'inline-block', margin: 4}} />;
	}

	renderDeck(stack, cards) {
		return cards.map(c => {
			if((stack === 1 && (c.code == this.state.selected1 || this.state.matched[c.code])) || (stack === 2 && (c.code == this.state.selected2  || this.state.matched[c.code]))) {
				return <img key={c.code} src={c.image} style={{width: 100,  margin: 4}} onClick={e => this.onCardClick(stack, c)} />;
			} else {
				return this.renderBack(stack, c);
			}
		});
	}

	onCardClick(stack, card) {
		if(stack == 1 && !this.state.selected1) {
			this.setState({
				selected1: card.code
			}, this.match);
		} else if(stack == 2 && !this.state.selected2) {
			this.setState({
				selected2: card.code
			}, this.match);
		}
	}

	match() {
		if(this.state.selected1 && this.state.selected1 === this.state.selected2) {
			this.setState({
				matched: {
					...this.state.matched,
					[this.state.selected2]: true
				}
			})
		}
	}

	submitScore(name, score) {
		firebase.database().ref(`scores/${name}`).set(score);
	}

	render() {
		const { deck1, deck2 }= this.state;

		if(!deck2 || !deck1) return <h5>Loading</h5>;

		return (
			<div>
				<div className="flex end">
					<div>
						<button onClick={e => this.start()}>play</button>
						<button>Reset high score</button>
					</div>
					<div>
						Turns so far: <strong>{this.state.turns}</strong>
					</div>
				</div>
				<br/>
				<div className="row">
					<div className="col-md-6">
						<h5>Deck 1</h5>
						<div>
							{this.renderDeck(1, deck1.cards)}
						</div>
					</div>
					<div className="col-md-6">
						<h5>Deck 2</h5>
						<div>
							{this.renderDeck(2, deck2.cards)}
						</div>
					</div>
				</div>
				<br/>
				<div className="row">
					<div className="col-md-8">
						<h5>High scores</h5>
						{Object.keys(this.state.highscores).map((name, i) => <li key={i}>{name} : {this.state.highscores[name]}</li>)}
					</div>
				</div>
			</div>
		);
	}
}

export default App;
