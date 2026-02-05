import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Clock, 
  GitBranch, 
  Target, 
  CheckCircle, 
  XCircle,
  Plus,
  Save,
  Play
} from 'lucide-react';

// Custom node types
const nodeTypes = {
  email: EmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  abSplit: ABSplitNode,
  goalCheck: GoalCheckNode,
  exit: ExitNode,
};

interface SequenceFlowBuilderProps {
  sequenceId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

export default function SequenceFlowBuilder({
  sequenceId,
  initialNodes = [],
  initialEdges = [],
  onSave,
}: SequenceFlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [nodeConfig, setNodeConfig] = useState<any>({});

  const onConnect = useCallback(
    (params: Connection) => {
      // Validation: prevent invalid connections
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Prevent connecting from Exit node
      if (sourceNode.type === 'exit') {
        alert('Exit nodes cannot connect to other nodes');
        return;
      }
      
      // Prevent self-connections
      if (params.source === params.target) {
        alert('Cannot connect a node to itself');
        return;
      }
      
      // Check for circular dependencies (simple check)
      const wouldCreateCycle = (sourceId: string, targetId: string): boolean => {
        const visited = new Set<string>();
        const queue = [targetId];
        
        while (queue.length > 0) {
          const current = queue.shift()!;
          if (current === sourceId) return true;
          if (visited.has(current)) continue;
          visited.add(current);
          
          edges.forEach((edge) => {
            if (edge.source === current) {
              queue.push(edge.target);
            }
          });
        }
        return false;
      };
      
      if (params.source && params.target && wouldCreateCycle(params.source, params.target)) {
        alert('Cannot create circular connections');
        return;
      }
      
      // Determine edge label based on source handle
      let label = '';
      if (params.sourceHandle === 'yes') label = 'Yes';
      else if (params.sourceHandle === 'no') label = 'No';
      else if (params.sourceHandle === 'variant-a') label = 'Variant A';
      else if (params.sourceHandle === 'variant-b') label = 'Variant B';
      else if (params.sourceHandle === 'goal-met') label = 'Goal Met';
      else if (params.sourceHandle === 'goal-not-met') label = 'Not Met';
      
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        label,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, nodes, edges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: getDefaultNodeData(type),
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case 'email':
        return { label: 'New Email', subject: '', body: '' };
      case 'wait':
        return { label: 'Wait', waitDays: 1 };
      case 'condition':
        return { label: 'Condition', conditionType: 'replied' };
      case 'abSplit':
        return { label: 'A/B Split', variantAPercentage: 50 };
      case 'goalCheck':
        return { label: 'Goal Check', goalType: 'replied' };
      case 'exit':
        return { label: 'Exit Sequence' };
      default:
        return { label: 'Node' };
    }
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeConfig(node.data);
    setIsConfigOpen(true);
  }, []);

  const saveNodeConfig = () => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, ...nodeConfig } }
          : node
      )
    );
    setIsConfigOpen(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  const onLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 200, height: 80 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 100,
          y: nodeWithPosition.y - 40,
        },
      };
    });

    setNodes(layoutedNodes);
  }, [nodes, edges, setNodes]);

  return (
    <div className="h-[calc(100vh-12rem)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'email': return '#10b981';
              case 'wait': return '#3b82f6';
              case 'condition': return '#8b5cf6';
              case 'abSplit': return '#f59e0b';
              case 'goalCheck': return '#06b6d4';
              case 'exit': return '#ef4444';
              default: return '#6b7280';
            }
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        
        <Panel position="top-left" className="space-y-2">
          <Card className="w-64">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add Node</CardTitle>
              <CardDescription className="text-xs">
                Drag nodes onto the canvas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('email')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('wait')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Wait
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('condition')}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Condition
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('abSplit')}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                A/B Split
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('goalCheck')}
              >
                <Target className="w-4 h-4 mr-2" />
                Goal Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('exit')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </CardContent>
          </Card>
        </Panel>

        <Panel position="top-right" className="flex gap-2">
          <Button variant="outline" onClick={onLayout}>
            <Play className="w-4 h-4 mr-2" />
            Auto Layout
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Sequence
          </Button>
        </Panel>
      </ReactFlow>

      {/* Node Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedNode?.data.label || 'Node'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedNode?.type === 'email' && (
              <>
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={nodeConfig.subject || ''}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, subject: e.target.value })}
                    placeholder="Enter email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    value={nodeConfig.body || ''}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, body: e.target.value })}
                    placeholder="Enter email content"
                    rows={8}
                  />
                </div>
              </>
            )}

            {selectedNode?.type === 'wait' && (
              <div>
                <Label htmlFor="waitDays">Wait Days</Label>
                <Input
                  id="waitDays"
                  type="number"
                  min="0"
                  value={nodeConfig.waitDays || 1}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, waitDays: parseInt(e.target.value) })}
                />
              </div>
            )}

            {selectedNode?.type === 'condition' && (
              <div>
                <Label htmlFor="conditionType">Condition Type</Label>
                <Select
                  value={nodeConfig.conditionType || 'replied'}
                  onValueChange={(value) => setNodeConfig({ ...nodeConfig, conditionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replied">Prospect Replied</SelectItem>
                    <SelectItem value="not_replied">No Reply</SelectItem>
                    <SelectItem value="opened">Email Opened</SelectItem>
                    <SelectItem value="not_opened">Email Not Opened</SelectItem>
                    <SelectItem value="clicked_link">Link Clicked</SelectItem>
                    <SelectItem value="negative_response">Negative Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedNode?.type === 'abSplit' && (
              <div>
                <Label htmlFor="variantAPercentage">Variant A Percentage</Label>
                <Input
                  id="variantAPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={nodeConfig.variantAPercentage || 50}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, variantAPercentage: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Remaining {100 - (nodeConfig.variantAPercentage || 50)}% goes to Variant B
                </p>
              </div>
            )}

            {selectedNode?.type === 'goalCheck' && (
              <div>
                <Label htmlFor="goalType">Goal Type</Label>
                <Select
                  value={nodeConfig.goalType || 'replied'}
                  onValueChange={(value) => setNodeConfig({ ...nodeConfig, goalType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replied">Prospect Replied</SelectItem>
                    <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
                    <SelectItem value="demo_requested">Demo Requested</SelectItem>
                    <SelectItem value="link_clicked">Link Clicked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsConfigOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={saveNodeConfig} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Custom Node Components
function EmailNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-blue-500 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-blue-500" />
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      {data.subject && (
        <div className="text-xs text-gray-500 mt-1 truncate">{data.subject}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

function WaitNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-orange-500 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-orange-500" />
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      <div className="text-xs text-gray-500 mt-1">Wait {data.waitDays} day(s)</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

function ConditionNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-purple-500 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-purple-500" />
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      <div className="text-xs text-gray-500 mt-1 capitalize">
        {data.conditionType?.replace('_', ' ')}
      </div>
      <Handle type="source" position={Position.Left} id="yes" className="w-3 h-3" />
      <Handle type="source" position={Position.Right} id="no" className="w-3 h-3" />
    </div>
  );
}

function ABSplitNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-green-500 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-green-500" />
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        A: {data.variantAPercentage}% / B: {100 - data.variantAPercentage}%
      </div>
      <Handle type="source" position={Position.Left} id="variant-a" className="w-3 h-3" />
      <Handle type="source" position={Position.Right} id="variant-b" className="w-3 h-3" />
    </div>
  );
}

function GoalCheckNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-teal-500 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-teal-500" />
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      <div className="text-xs text-gray-500 mt-1 capitalize">
        {data.goalType?.replace('_', ' ')}
      </div>
      <Handle type="source" position={Position.Left} id="goal-met" className="w-3 h-3" />
      <Handle type="source" position={Position.Right} id="goal-not-met" className="w-3 h-3" />
    </div>
  );
}

function ExitNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-red-500 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4 text-red-500" />
        <div className="font-bold text-sm">{data.label}</div>
      </div>
    </div>
  );
}
