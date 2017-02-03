/*
	List.js object
*/
const everyone = new List('everyone', {
	listClass: 'cards',
	valueNames: ['name', 'height', 'weight', 'hp', 'experience', 'attack', 'defense']
});

/*
	Pokemon card template
*/
const createPokemonCard = function(pokemon, withDescriptions = false, withMoves = false, withFilters = false) {
	return `
		<div class="card">
			<div class="image">
				<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pkdx_id}.png" alt="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pkdx_id}.png">
			</div>
			<div class="content">
				<a href="#dossier" data-pokemonid="${pokemon.pkdx_id}" class="ui dividing header">${pokemon.name}</a>
				<div class="meta">
					${
						'<div class="ui horizontal label">' + pokemon.types.map(t => t.name).filter(String).join('</div><div class="ui horizontal label">') + '</div>'
					}
				</div>
				<div class="description">
					<span class="right floated">
						<span data-tooltip="HP" data-inverted><i class="icon empty heart"></i>${pokemon.hp}</span>
						&nbsp;<span data-tooltip="Experience" data-inverted><i class="icon bullseye"></i>${pokemon.exp}</span>
					</span>
					<span data-tooltip="Height &times; Weight" data-inverted>
						<i class="icon move"></i>${pokemon.height} &times; ${pokemon.weight}
					</span>
					<br />
					<span data-tooltip="Defense" data-inverted class="right floated"><i class="icon protect"></i>${pokemon.defense}</span>
					<span data-tooltip="Attack @ Speed" data-inverted><i class="icon bomb"></i>${pokemon.attack} @ ${pokemon.speed}</span>
					${
						withMoves
						?	'<div class="ui horizontal divider">Top 7 moves (of ' + pokemon.moves.length + ' total)</div><div class="ui ordered list"><div class="item">' +
							pokemon.moves.slice(0,7).map(m => m.name).filter(String).join('</div><div class="item">') +
							'</div></div>'
						:	''
					}
					${
						withDescriptions
						?	'<div class="ui horizontal divider">Descriptions</div><div class="ui bulleted list"><div class="item">' +
							pokemon.descriptions.slice(0,7).map(d => d.description).filter(String).join('</div><div class="item">') +
							'</div></div>'
						:	''
					}
				</div>
			</div>
			<div class="extra content">
				<span data-tooltip="Happiness" data-inverted class="right floated">
					<i class="icon ${pokemon.happiness >= 150 ? 'smile' : (pokemon.happiness <= 90 ? 'frown' : 'meh')}"></i>${pokemon.happiness}
				</span>
				<span data-tooltip="Evolutions to" data-inverted>
					Evo: ${(pokemon.evolutions.length > 0 ? pokemon.evolutions[0].to : '&mdash;')}
				</span>
			</div>
			${
				withFilters
				?	'<span class="hidden name">' + pokemon.name + '</span>' +
					'<span class="hidden height">' + pokemon.height + '</span>' +
					'<span class="hidden weight">' + pokemon.weight + '</span>' +
					'<span class="hidden hp">' + pokemon.hp + '</span>' +
					'<span class="hidden experience">' + pokemon.exp + '</span>' +
					'<span class="hidden attack">' + pokemon.attack + '</span>' +
					'<span class="hidden defense">' + pokemon.defense + '</span>'
				:	''
			}
		</div>
	`;
}

/*
	Renders all the Pokemons
*/			
const list = document.querySelector('#list');
const renderPokemons = (collection) => {
	for (i in collection) {
		const pokemon = collection[i];
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = createPokemonCard(pokemon, false, false, true);
		while (tempDiv.firstChild) {
			list.appendChild(tempDiv.firstChild);
		}
	}
}

/*
	Pokemon fetcher, offsets itself automagically,
	also tells if it's fetching or not.
	Caches pokemons
*/
const cache = [];
const getMoarPokemons = ((limit) => {
	let fetching = false;
	let offset = 0;
	const swooosh = function(limit) {
		fetching = true;
		fetch('https://pokeapi.co/api/v1/pokemon/?limit=' + limit + '&offset=' + offset*12)
			.then(response => response.json())
			.then(json => {
				if (json.hasOwnProperty('objects')) {
					if (json.objects.length > 0) {
						cache.push(...json.objects);
						renderPokemons(json.objects);
						fetching = false;
						everyone.reIndex();
					}
				}
			})
			.catch(fetching = false);
		offset++;
	};
	swooosh.isFetching = () => fetching;
	return swooosh;
})();

/*
	If page is scrolled to it's very bottom,
	and collection ISN'T filtered,
	and there is nothing fetching at the moment,
	well then, go fetch moar pokemons
*/
const moar = document.querySelector('#moar');
const isInViewport = (element) => {
	const rect = element.getBoundingClientRect();
	const html = document.documentElement;
	return (
		window.getComputedStyle(moar).display !== 'none' &&
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || html.clientHeight) &&
		rect.right <= (window.innerWidth || html.clientWidth)
	);
}
const search = document.querySelector('#search');
window.addEventListener('scroll', function() {
	if (isInViewport(moar) && search.value === '' && !getMoarPokemons.isFetching()) {
		getMoarPokemons(12);
	}
});

/*
	Attach one event listener on the document,
	instead of attaching onClick handlers on each card.
	Gets pokemon from cache, fires a lot of fetch requests
	and gathers all the move and descriptions.
	Shows the profile
*/
const profile = document.querySelector('#profile');
document.addEventListener('click', function(event) {
	let element = event.target;
	while (element) {
		if (element.hasAttribute('data-pokemonid')) {
			const pokemon = cache.find(p => p.pkdx_id == element.getAttribute('data-pokemonid'));
			if (pokemon) {
				Promise.all([
					...pokemon.descriptions.slice(0,7).map(d => fetch('https://pokeapi.co' + d.resource_uri))
				])
				.then(fetches => fetches.map(
					f => f.json()
					.then(x => {
						if (x.resource_uri.includes('description')) {
							const description = pokemon.descriptions.find(d => d.resource_uri.split('/').reverse().splice(1).shift() == x.id);
							description.description = x.description;
						}
					})
				))
				.then(result => {
					profile.innerHTML = createPokemonCard(pokemon, true, true, false);
				});
			}
			break;
		} else {
			element = element.parentElement;
		}
	}
}, false);

/*
	Get first 12 pokemons
*/
getMoarPokemons(12);
