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

function HasCircuit(vertex) {
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

	
	for (var v in visited) {
		console.log(visited[v]);
	}

	return true;
}

function IsClosed($target) {
	for (var thisVertexID in $target.data("edge")) {
		if (HasCircuit($target.data("edge")[thisVertexID])) return true;
	}

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
	let $controls = $($("#t-controls").html());
	var $pieceLastCommitted = null;
	var $pieceLastSelected = null;
	
	function $MakeItem() {
		var $item = $("<li>").click(function() {
			if ($pieceLastSelected && !$pieceLastSelected.data("committed"))
				$pieceLastSelected.removeClass("used");
			
			if ($(this).data("committed")) return;
			$(this).data("committed", false)
			
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
		
		$pieceLastCommitted = $target;
		
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
		
		var date = new Date();
		console.log(date.getTime());
		
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
		
		if (IsClosed($target)) alert("Loop detected!");
		
		$controls.hide();
	})

	var $StartList = $("<ul>").append($MakeItem());
	$("body > div#board").append($StartList);
});
