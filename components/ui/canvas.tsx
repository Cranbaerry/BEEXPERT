import { Stage, Layer, Line, Rect } from "react-konva";
import React, { useEffect, useRef, useState, useImperativeHandle } from "react";
import { CanvasProps, LineData } from "@/lib/definitions";
import Konva from "konva";
import { Card } from "@/components/ui/card";
import {
  HandIcon,
  Pencil1Icon,
  EraserIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ZoomInIcon,
  ZoomOutIcon,
  LineHeightIcon,
} from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { Image as KonvaImage } from "react-konva";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KonvaEventObject } from "konva/lib/Node";

function Canvas(props: CanvasProps) {
  const stageParentRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [tool, setTool] = useState<"pencil" | "eraser" | "drag">("pencil");
  const [lines, setLines] = useState<LineData[]>([]);
  const isDrawing = useRef<boolean>(false);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [showPlaceholder, setShowPlaceholder] = useState<boolean>(true);
  const colorRef = useRef<string>("#000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [scale, setScale] = useState(1);
  const [history, setHistory] = useState<LineData[][]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useImperativeHandle(props.canvasRef, () => ({
    handleExport: () => handleExport(),
    getDimensions: () => dimensions,
    resetCanvas: () => resetCanvas(),
    handleTouchMoveFromParent: (e: TouchEvent) => handleTouchMoveFromParent(e),
    handleTouchStartFromParent: (e: TouchEvent) =>
      handleTouchStartFromParent(e),
    handleTouchEndFromParent: (e: TouchEvent) => handleTouchEndFromParent(e),
  }));

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setLines(JSON.parse(JSON.stringify(history[newStep])));
      setHistoryStep(newStep);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setLines(JSON.parse(JSON.stringify(history[newStep])));
      setHistoryStep(newStep);
    }
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  };

  const handleExport = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      return uri;
    }
    return "";
  };

  const handleResize = () => {
    const container = stageParentRef.current;
    if (!container) return;
    setDimensions({
      width: container.offsetWidth,
      height: container.offsetHeight,
    });
  };

  const handleColorChange = (e: string) => {
    colorRef.current = e;
  };

  const resetCanvas = () => {
    setLines([]);
    setHistory([]);
    setHistoryStep(-1);
    setShowPlaceholder(true);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getCursorStyle = () => {
    switch (tool) {
      case "pencil":
        return "cell";
      case "eraser":
        return "not-allowed";
      case "drag":
        return "grab";
      default:
        return "default";
    }
  };

  // Common drawing function for mouse and touch events
  const startDrawing = (position: { x: number; y: number }) => {
    if (tool === "drag") return;
    if (showPlaceholder) setShowPlaceholder(false);
    isDrawing.current = true;

    // Create an initial history entry if none exists
    if (historyStep === -1) {
      setHistory([[]]); // Store the initial empty state in history
      setHistoryStep(0);
    }

    setLines((prevLines) => [
      ...prevLines,
      {
        tool,
        points: [position.x, position.y],
        color: colorRef.current,
        size: strokeWidth,
      },
    ]);
  };

  const draw = (position: { x: number; y: number }) => {
    if (tool === "drag" || !isDrawing.current) return;

    setLines((prevLines) => {
      const lastLine = prevLines[prevLines.length - 1];
      lastLine.points = lastLine.points.concat([position.x, position.y]);
      const newLines = [...prevLines.slice(0, -1), lastLine];
      return newLines;
    });
  };

  const stopDrawing = () => {
    if (tool === "drag") return;
    isDrawing.current = false;
    const newHistory = history.slice(0, historyStep + 1);
    setHistory([...newHistory, lines]);
    setHistoryStep(newHistory.length);
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos || !stage) return;

    const adjustedPos = {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };

    startDrawing(adjustedPos);
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos || !stage) return;

    const adjustedPos = {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };

    draw(adjustedPos);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();

    const stage = e.target.getStage();
    if (!stage) return;

    const touch = e.evt.touches[0];
    const boundingRect = stage.container().getBoundingClientRect();

    const adjustedPos = {
      x: (touch.clientX - boundingRect.left) / scale,
      y: (touch.clientY - boundingRect.top) / scale,
    };

    startDrawing(adjustedPos);
  };

  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.stopPropagation();
    e.evt.preventDefault();

    const stage = e.target.getStage();

    if (!stage || !isDrawing.current) return;

    const touch = e.evt.touches[0];
    const boundingRect = stage.container().getBoundingClientRect();

    const adjustedPos = {
      x: (touch.clientX - boundingRect.left) / scale,
      y: (touch.clientY - boundingRect.top) / scale,
    };

    draw(adjustedPos);
  };

  const handleTouchEnd = () => {
    stopDrawing();
  };

  const handleTouchStartFromParent = (e: TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!stageRef.current) return;

    const stage = stageRef.current.getStage();
    const konvaEvent = {
      evt: e,
      target: stage,
      currentTarget: stage,
      type: "touchstart",
      pointerId: e.touches[0].identifier,
    } as unknown as Konva.KonvaEventObject<TouchEvent>;

    // Forward the event to handleTouchStart
    handleTouchStart(konvaEvent);
  };

  const handleTouchMoveFromParent = (e: TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!stageRef.current) return;

    const stage = stageRef.current.getStage();
    const konvaEvent = {
      evt: e,
      target: stage,
      currentTarget: stage,
      type: "touchmove",
      pointerId: e.touches[0].identifier,
    } as unknown as Konva.KonvaEventObject<TouchEvent>;

    // Forward the event to handleTouchMove
    handleTouchMove(konvaEvent);
  };

  const handleTouchEndFromParent = (e: TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!stageRef.current) return;

    const stage = stageRef.current.getStage();
    const konvaEvent = {
      evt: e,
      target: stage,
      currentTarget: stage,
      type: "touchend",
      pointerId: e.changedTouches[0].identifier,
    } as unknown as Konva.KonvaEventObject<TouchEvent>;

    // Forward the event to handleTouchEnd
    handleTouchEnd(konvaEvent);
  };

  function TooltipWrapper({
    content,
    children,
  }: {
    content: string;
    children: React.ReactNode;
  }) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <TooltipProvider>
      <Card className="h-full">
        <div className="flex bg-background h-full">
          <ScrollArea>
            <div className="w-16 bg-muted p-2 flex flex-col space-y-4 border-r h-full">
              <TooltipWrapper content="Drag">
                <Button
                  onClick={() => setTool("drag")}
                  variant={tool === "drag" ? "default" : "ghost"}
                  size="icon"
                  className="tool__drag w-full"
                >
                  <HandIcon className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <TooltipWrapper content="Pencil">
                <Button
                  onClick={() => setTool("pencil")}
                  variant={tool === "pencil" ? "default" : "ghost"}
                  size="icon"
                  className="tool__pencil w-full"
                >
                  <Pencil1Icon className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <TooltipWrapper content="Eraser">
                <Button
                  onClick={() => setTool("eraser")}
                  variant={tool === "eraser" ? "default" : "ghost"}
                  size="icon"
                  className="tool__eraser w-full"
                >
                  <EraserIcon className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <Separator className="my-2" />
              {/* <TooltipWrapper content="Reset">
                <Button
                  onClick={resetCanvas}
                  size="icon"
                  variant="ghost"
                  className="tool__reset w-full"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <Separator className="my-2" /> */}
              <TooltipWrapper content="Color">
                <div className="tool__color flex justify-center">
                  <ColorPicker
                    color={colorRef.current}
                    onChange={handleColorChange}
                  />
                </div>
              </TooltipWrapper>
              <Separator className="my-2" />
              <Popover>
                <TooltipWrapper content="Stroke Width">
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="tool__stroke_width w-full"
                    >
                      <LineHeightIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipWrapper>
                <PopoverContent className="w-64">
                  <div className="flex flex-col space-y-2">
                    <label
                      htmlFor="stroke-width"
                      className="text-sm font-medium"
                    >
                      Stroke Width: {strokeWidth}px
                    </label>
                    <Slider
                      id="stroke-width"
                      min={1}
                      max={20}
                      step={1}
                      value={[strokeWidth]}
                      onValueChange={(value) => setStrokeWidth(value[0])}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <Separator className="my-2" />
              <TooltipWrapper content="Undo">
                <Button
                  onClick={handleUndo}
                  disabled={historyStep <= 0}
                  size="icon"
                  variant="ghost"
                  className="tool__undo w-full"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <TooltipWrapper content="Redo">
                <Button
                  onClick={handleRedo}
                  disabled={historyStep >= history.length - 1}
                  size="icon"
                  variant="ghost"
                  className="tool__redo w-full"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <Separator className="my-2" />
              <TooltipWrapper content="Zoom In">
                <Button
                  onClick={handleZoomIn}
                  size="icon"
                  variant="ghost"
                  className="tool__zoom_in w-full"
                >
                  <ZoomInIcon className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <TooltipWrapper content="Zoom Out">
                <Button
                  onClick={handleZoomOut}
                  size="icon"
                  variant="ghost"
                  className="tool__zoom_out w-full"
                >
                  <ZoomOutIcon className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <div className="text-xs text-center">
                {Math.round(scale * 100)}%
              </div>
            </div>
          </ScrollArea>
          <div className="flex-1 overflow-auto">
            <div ref={stageParentRef} className="h-full w-full">
              <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                scaleX={scale}
                scaleY={scale}
                draggable={tool === "drag"}
                style={{
                  backgroundColor: props.backgroundColor,
                  borderColor: "#e4e4e7",
                  cursor: getCursorStyle(),
                }} // Dynamically set cursor
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <Layer>
                  <Rect
                    x={0}
                    y={0}
                    width={dimensions.width / scale}
                    height={dimensions.height / scale}
                    listening={false}
                    fill={props.backgroundColor}
                  />
                  {props.questionsSheetImageSource && (
                    <KonvaImage
                      image={props.questionsSheetImageSource}
                      x={5}
                      y={10}
                      height={(dimensions.height * 0.75) / scale}
                      width={
                        props.questionsSheetImageSource instanceof
                        HTMLImageElement
                          ? (props.questionsSheetImageSource.width *
                              ((dimensions.height * 0.75) / scale)) /
                            props.questionsSheetImageSource.height
                          : undefined // Fallback in case it's not an HTMLImageElement
                      }
                      scaleX={scale}
                      scaleY={scale}
                    />
                  )}
                  {lines.map((line, i) => (
                    <Line
                      key={i}
                      points={line.points}
                      stroke={line.color}
                      strokeWidth={line.size / scale}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation={
                        line.tool === "eraser"
                          ? "destination-out"
                          : "source-over"
                      }
                    />
                  ))}
                  {/* {showPlaceholder && (
                    <Text
                      text="Interact to start drawing"
                      x={dimensions.width / 2}
                      y={dimensions.height / 2}
                      fontSize={24}
                      fontFamily="Arial"
                      fill="gray"
                      align="center"
                      verticalAlign="middle"
                      offsetX={150}
                      offsetY={40}
                      padding={20}
                    />
                  )} */}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}

export default Canvas;
