function lovr.load()
end

function lovr.draw()
	lovr.graphics.setBackgroundColor(.2, .2, .2)

	lovr.graphics.setColor(0,1.0,0)
	lovr.graphics.print('hello world', 0, 1, -1, .5)
	lovr.graphics.cube('line', 0, 1, -1, .5, lovr.timer.getTime())
end