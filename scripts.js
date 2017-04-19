var Turn = 0;

function GetTilesPerTurn() {
	return $("#setting-tiles-turn button[data-reset]").data("level");
}

function GetRequiredAdjacentTilesPerTurn() {
	return $("#setting-tiles-adjacent button[data-reset]").data("level");
}

function GetPlayerIDFromTurn(turn) {
	return Math.floor(turn / GetTilesPerTurn()) % 2;
}

function GetPlayerTurnFromTurn(turn) {
	return turn % GetTilesPerTurn();
}

function GetBoardUnitCount() {
	return $("#setting-unit-count button[data-reset]").data("level");
}

function UpdateTurnDisplay(turn) {
	if (turn < GetBoardUnitCount()) $("#turn-display").text("Move " + (turn + 1) + "/" + GetBoardUnitCount() + ": P" + (GetPlayerIDFromTurn(turn) + 1) + "-" + (GetPlayerTurnFromTurn(turn) + 1));
	else $("#turn-display").text("Game Over");
}

function Neighbors($target) {
	let $column = $target.parent();
	let $columnPrev = $column.prev();
	let $columnNext = $column.next();
	let offset = $column.hasClass("offset");
	let currentIndex = $target.index();
	
	let $columnChildren = $column.children();
	
	var neighbors = new Array();
	
	let indexOffset = (offset? 0 : -1);
	
	
	if (currentIndex - 1 >= 0) neighbors.push($columnChildren[currentIndex - 1]);
	else neighbors.push(null);
	
	if ($columnNext.length) {
		let $columnNextChildren = $columnNext.children();
		
		if ($columnNextChildren[currentIndex + indexOffset]) neighbors.push($columnNextChildren[currentIndex + indexOffset]);
		else neighbors.push(null);
		
		if ($columnNextChildren[currentIndex + 1 + indexOffset]) neighbors.push($columnNextChildren[currentIndex + 1 + indexOffset]);
		else neighbors.push(null);
		
	} else {
		neighbors.push(null);
		neighbors.push(null);
	}
	
	if (currentIndex + 1 < $columnChildren.length) neighbors.push($columnChildren[currentIndex + 1]);
	else neighbors.push(null);
	
	if ($columnPrev.length) {
		let $columnPrevChildren = $columnPrev.children();
		
		if ($columnPrevChildren[currentIndex + 1 + indexOffset]) neighbors.push($columnPrevChildren[currentIndex + 1 + indexOffset]);
		else neighbors.push(null);
		
		if ($columnPrevChildren[currentIndex + indexOffset]) neighbors.push($columnPrevChildren[currentIndex + indexOffset]);
		else neighbors.push(null);
		
	} else {
		neighbors.push(null);
		neighbors.push(null);
	}
	
	return neighbors;
}

function CommittedNeighborCount(neighbors) {
	var count = 0;
	for (var i = 0; i < neighbors.length; i++) {
		count += neighbors[i] && $(neighbors[i]).hasClass("used")? 1 : 0;
	}
	return count;
}

function GetRemainingUnitsForTurn(turn) {
	return $("#setting-tiles-turn button[data-reset]").data("level") - GetPlayerTurnFromTurn(turn);
}

function GetCircuit(vertex) {
	var visited = new Array();
	
	if (!vertex) return false; // If no vertex was passed, a loop is impossible.
	
	do {
		// Visit the current vertex, by getting source from an edge
		// Notice that they're both coming form the same vertex, meaning,
		// source is the same on vertex[0] and vertex[1]...
		visited.push(vertex);
		
		let vertexA = vertex.edgeA && vertex.edgeA.destination.data("edge")[vertex.edgeA.vertexID];
		let vertexB = vertex.edgeB && vertex.edgeB.destination.data("edge")[vertex.edgeB.vertexID];
		
		// It doesn't have two connections, it's not part of a circuit.
		if (!vertexA || !vertexB) return false;

		vertex = false; // Clear vertex and attempt to populate it based on vertexA or vertexB.

		// Go to the next unvisited neighbor, either vertexA or vertexB.
		// If all neighbor vertices have been visited, we've got a loop!
		if (visited.indexOf(vertexA) < 0) vertex = vertexA; 
		else
		if (visited.indexOf(vertexB) < 0) vertex = vertexB;
		
	} while (vertex); // If we've still go at least one unvisited vertex, continue checking.

	return visited;
}

function GetCircuits($target) {
	var circuits = new Array();
	for (var thisVertexID in $target.data("edge")) {
		let circuit = GetCircuit($target.data("edge")[thisVertexID]);
		circuits[thisVertexID] = circuit? circuit : false;
	}
	return circuits;	
}

function GetStraightCountFromCircuit(path) {
	var totalStraight = 0;
	for	(var i in path) {
		if (path[i].edgeA.vertexID == 1) totalStraight += 1;
		if (path[i].edgeB.vertexID == 1) totalStraight += 1;
	}
	return totalStraight / 2;
}

function GetStraightMaxAdjacentCountFromCircuit(path) {
	var globalMaximum = 0;
	var localMaximum = 0;
	for (var i = 0; i < path.length || (localMaximum > 0 && i < path.length * 2); i++) {
		let thisVertex = path[i % path.length];
		let thatVertex = path[(i + 1) % path.length];
		
		thisVertex.edgeA.source.css("border", "1px solid red");
		thatVertex.edgeA.source.css("border", "1px solid red");
		
		let thisEdge = (thisVertex.edgeA.destination[0] === thatVertex.edgeA.source[0])? thisVertex.edgeA : thisVertex.edgeB;
		let thatEdge = (thatVertex.edgeA.destination[0] === thisVertex.edgeA.source[0])? thatVertex.edgeA : thatVertex.edgeB;
		
		if (thisEdge.vertexID != 1 || thatEdge.vertexID != 1) {
			if (localMaximum > globalMaximum) globalMaximum = localMaximum; 
			localMaximum = 0;
		} else localMaximum++;
		
		
		thisVertex.edgeA.source.css("border", "none");
		thatVertex.edgeA.source.css("border", "none");
	}
	return (globalMaximum > 0)? globalMaximum + 1 : 0;
}

function GetWinnerFromTarget($target) {
	let requiredStraightsMinimal = $("#setting-straights-minimal button[data-reset]").data("level");
	let requiredStraigthsAdjacent = $("#setting-straights-adjacent button[data-reset]").data("level");
	
	let circuits = GetCircuits($target);
	
	// All will be initially assumed to not be candidates.
	var candidateCircuit = [false, false, false];
	
	for (var c = 0; c < circuits.length; c++) {
		if (!circuits[c]) continue;
		if (GetStraightCountFromCircuit(circuits[c]) < requiredStraightsMinimal) continue;
		if (GetStraightMaxAdjacentCountFromCircuit(circuits[c]) < requiredStraigthsAdjacent) continue;
		candidateCircuit[c] = true;
	}
	
	let playerACircuit = (circuits[0] && !circuits[1])? 0 : ((circuits[1] && circuits[2])? 1 : false);
	let playerBCircuit = (circuits[2] && !circuits[1])? 2 : ((circuits[1] && circuits[0])? 1 : false);
	
	var playerAWon = false;
	var playerBWon = false;
	
	if (playerACircuit !== false && candidateCircuit[playerACircuit]) playerAWon = true;
	if (playerBCircuit !== false && candidateCircuit[playerBCircuit]) playerBWon = true;
	
	if (playerAWon && playerBWon) return "OPPONENT";
	
	if (playerAWon) return "PLAYER2";
	if (playerBWon) return "PLAYER1";
	
	return false;
}

function VertexIDForFaceID($piece, faceID) {
	let rotation = {0: 0, 120: 1, 240: 2}[$piece.data("rotation")];
	let map = [[[0, 1], [2, 5], [3, 4]], [[2, 3], [1, 4], [0, 5]], [[4, 5], [0, 3], [1, 2]]][rotation];
	
	for (var i = 0; i < map.length; i++) {
		if (map[i].indexOf(faceID) >= 0) return i;
	}
}

$(function() {
	// Settings Interface Logic =======================================
	// ================================================================
	$("#setting-unit-count button[data-reset]").data({level:48, levelStart:48, levelMinimum:48, label:" Available"});
	$("#setting-tiles-turn button[data-reset]").data({level:2, levelStart:2, levelMinimum:2, label:" Per Turn"});
	$("#setting-tiles-adjacent button[data-reset]").data({level:1, levelStart:1, levelMinimum:1, label:" Adjacent"});
	$("#setting-straights-minimal button[data-reset]").data({level:1, levelStart:1, levelMinimum:1, label:" Required"});
	$("#setting-straights-adjacent button[data-reset]").data({level:0, levelStart:0, levelMinimum:0, label:" Adjacent"});
	
	$("#setting-unit-count button, #setting-tiles-turn button, #setting-tiles-adjacent button, #setting-straights-minimal button, #setting-straights-adjacent button").not("[data-reset]").click(function(event) {
		let $display = $(this).closest("div.btn-group-justified").find("button[data-reset]");
		
		let offset = $(this).attr("data-increment") !== undefined? 1 : ($(this).attr("data-decrement") !== undefined? -1 : 0);
		let result = $display.data("level") + offset;
		
		if (result >= $display.data("levelMinimum"))
		{
			$display.data("level", result);
			$display.text(result + $display.data("label"));
			$display.prop("disabled", (result == $display.data("levelMinimum")));
		}
	});
	
	$("#setting-unit-count button, #setting-tiles-turn button, #setting-tiles-adjacent button, #setting-straights-minimal button, #setting-straights-adjacent button").filter("[data-reset]").click(function(event) {
		let $this = $(this);
		$this.data("level", $this.data("levelStart")).text($this.data("level") + $this.data("label")).prop("disabled", true);
	});
	
	$("#setting-unit-count, #setting-tiles-turn").click(function(event) {
		UpdateTurnDisplay(Turn);
	});
	
	
	// Tile Controller Logic ==========================================
	// ================================================================
	let $controls = $($("#t-controls").html());
	var $pieceLastCommitted = null;
	var $pieceLastSelected = null;
	
	function $MakeItem() {
		var $item = $("<li>").click(function() {
			if ($pieceLastSelected && !$pieceLastSelected.data("committed")) {
				$pieceLastSelected.removeClass("used");
				$controls.hide();
			}
			
			if ((Turn + 1) > GetBoardUnitCount()) return;
			
			if ($(this).data("committed")) return;
			$(this).data("committed", false)
			

			let neighbors = Neighbors($(this));
			
			if ($pieceLastCommitted) {
				if (GetRemainingUnitsForTurn(Turn) <= GetRequiredAdjacentTilesPerTurn() &&
					neighbors.indexOf($pieceLastCommitted[0]) < 0) {
					console.log("Piece not adjacent!"); 
					return;
				}
			}
			
			if (Turn > 0 && !CommittedNeighborCount(neighbors)) return;

			
			$pieceLastSelected = $(this);
			
			$controls.css("transform", "rotate(" + ($(this).data("rotation")? ($(this).data("rotation") * -1) : 0) + "deg)");
			$(this).addClass("used").append($controls);

			$controls.show();
		});
		
		$item.data("edge", [
			{edgeA:false, edgeB:false}, 
			{edgeA:false, edgeB:false}, 
			{edgeA:false, edgeB:false}
		]);
		$item.data("rotation", 0);
		
		return $item;
	}
	
	$controls.find("a.rotation").click(function() {
		let $parent = $(this).closest("li");
		let currentRotation = $parent.data("rotation") || 0;
		let offsetRotation = 120;
		let rotation = (currentRotation + offsetRotation) % 360;
		$parent.css("transform", "rotate(" + rotation + "deg)");
		$parent.data("rotation", rotation);
		$parent.children().each(function(i, child) {
			$(child).css("transform", "rotate(" + (-1 * $parent.data("rotation")) + "deg)")
		});
	})
	
	$controls.find("a.commit").click(function() {
		let $target = $(this).closest("li");
		let $parent = $target.parent();
		let neighbors = Neighbors($target);
		
		$pieceLastCommitted = GetPlayerIDFromTurn(Turn) == GetPlayerIDFromTurn(Turn + 1)? $target : false;
		
		$target.data("committed", true);
		
		if ($("body > div#board > ul:first-child").is($parent)) {
			var $list = $("<ul>");
			if (!$parent.hasClass("offset")) $list.addClass("offset");
			$parent.children().each(function(i) {
				$list.append($MakeItem());
			})
			$("body > div#board").prepend($list);
		}
		if ($("body > div#board > ul:last-child").is($parent)) {
			var $list = $("<ul>");
			if (!$parent.hasClass("offset")) $list.addClass("offset");
			$parent.children().each(function(i) {
				$list.append($MakeItem());
			})
			$("body > div#board").append($list);
		}
		if ($($parent.children().first()).is($target)) {
			$("body > div#board > ul").each(function(i) {
				$(this).prepend($MakeItem());
			});
		}
		if ($($parent.children().last()).is($target)) {
			$("body > div#board > ul").each(function(i) {
				$(this).append($MakeItem());
			});
		}
		
		// Attach line between neighboring tiles
		for (var thisFaceID = 0; thisFaceID < neighbors.length; thisFaceID++) {
			let $neighbor = neighbors[thisFaceID] && $(neighbors[thisFaceID]);
			
			// We only setup existing neighbors that are in use, skip the rest.
			if (!$neighbor || !$neighbor.hasClass("used")) continue;
			
			// Determine our neighbor's face facing us (neighbor side connecting us).
			let thatFaceID = (thisFaceID + 3) % 6;
			
			// Determine the vertex we're dealing with, based on the face of the pieces.
			// These are different since different faces connect to different vertices.
			let thisVertexID = VertexIDForFaceID($target, thisFaceID);
			let thatVertexID = VertexIDForFaceID($neighbor, thatFaceID);
			
			let thisVertex = $target.data("edge")[thisVertexID];
			let thatVertex = $neighbor.data("edge")[thatVertexID];
			
			// Push new edges to both pieces.
			if (!thisVertex.edgeA) thisVertex.edgeA = {source:$target, destination:$neighbor, vertexID:thatVertexID};
			else thisVertex.edgeB = {source:$target, destination:$neighbor, vertexID:thatVertexID};
			
			if (!thatVertex.edgeA) thatVertex.edgeA = {source:$neighbor, destination:$target, vertexID:thisVertexID};
			else thatVertex.edgeB = {source:$neighbor, destination:$target, vertexID:thisVertexID};
		}
		
		$controls.hide();
		
		let winner = GetWinnerFromTarget($target);
		if (winner) alert(winner + " won the game!");
		
		
		UpdateTurnDisplay(++Turn);
	})

	
	var $StartList = $("<ul>").append($MakeItem());
	$("body > div#board").append($StartList);
	
	UpdateTurnDisplay(Turn);
});
