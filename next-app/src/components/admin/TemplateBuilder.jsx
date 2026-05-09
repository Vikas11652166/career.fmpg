'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { 
  Save, Type, Square, Image as ImageIcon, QrCode, 
  Settings, Trash2, ArrowLeft, Move, AlignLeft, AlignCenter, AlignRight,
  Layers, ChevronUp, ChevronDown, MousePointer2, Hand
} from 'lucide-react';
import Link from 'next/link';

// Load Konva dynamically to prevent SSR issues
let Konva = null;
if (typeof window !== 'undefined') {
  Konva = require('konva').default || require('konva');
}

const INITIAL_SCALE = 0.6; // Scale down for editing view

export default function TemplateBuilder() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const trRef = useRef(null);
  const elementsMapRef = useRef({}); // Store references to Konva nodes
  const guideLinesRef = useRef([]); // Store snap guides

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [templateName, setTemplateName] = useState('New Custom Template');
  const [documentType, setDocumentType] = useState('certificate');
  const [isDefault, setIsDefault] = useState(false);
  const [activeTool, setActiveTool] = useState('select'); // select or pan
  
  const [canvasSettings, setCanvasSettings] = useState({
    width: 1123,
    height: 794,
    backgroundColor: '#ffffff',
    backgroundImage: '',
    backgroundGradient: ''
  });

  const handleDocumentTypeChange = (e) => {
    const val = e.target.value;
    setDocumentType(val);
    if (val === 'certificate') {
      setCanvasSettings(prev => ({...prev, width: 1123, height: 794}));
    } else {
      setCanvasSettings(prev => ({...prev, width: 794, height: 1123}));
    }
  };

  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Reference for state access inside Konva callbacks
  const stateRef = useRef({ elements, selectedElementId, canvasSettings, activeTool });
  useEffect(() => {
    stateRef.current = { elements, selectedElementId, canvasSettings, activeTool };
  }, [elements, selectedElementId, canvasSettings, activeTool]);

  // Keyboard Shortcuts (Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && stateRef.current.selectedElementId) {
        removeElement(stateRef.current.selectedElementId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!currentUser || !isAdmin) {
      router.push('/login');
      return;
    }
    if (id) fetchTemplate(id);
    else setLoading(false);
  }, [id, currentUser, isAdmin, router]);

  const fetchTemplate = async (templateId) => {
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok && data.template) {
        setTemplateName(data.template.name);
        setDocumentType(data.template.documentType);
        setIsDefault(data.template.isDefault);
        if (data.template.canvas) setCanvasSettings(data.template.canvas);
        if (data.template.elements) {
          setElements(data.template.elements.sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)));
        }
      } else {
        toast.error('Failed to load template');
        router.push('/admin/templates');
      }
    } catch (err) {
      toast.error('Error fetching template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalElements = elements.map(el => {
        const node = elementsMapRef.current[el.id];
        if (node) {
          return {
            ...el,
            x: node.x(), y: node.y(),
            width: node.width() * node.scaleX(), height: node.height() * node.scaleY(),
            rotation: node.rotation(), zIndex: node.getZIndex()
          };
        }
        return el;
      });

      const payload = {
        name: templateName,
        documentType,
        isDefault,
        canvas: canvasSettings,
        elements: finalElements
      };

      const url = id ? `/api/admin/templates/${id}` : '/api/admin/templates';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(id ? 'Template updated' : 'Template created');
        if (!id && data.template) router.replace(`/admin/templates/build?id=${data.template._id}`);
      } else {
        toast.error('Failed to save template');
      }
    } catch (err) {
      toast.error('Network error during save');
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------
  // KONVA INITIALIZATION & SYNC LOGIC
  // -----------------------------------------------------
  useEffect(() => {
    if (loading || !Konva || !containerRef.current) return;

    if (!stageRef.current) {
      const containerW = containerRef.current.offsetWidth;
      const containerH = containerRef.current.offsetHeight;

      const stage = new Konva.Stage({
        container: containerRef.current,
        width: containerW,
        height: containerH,
        draggable: false,
      });

      const layer = new Konva.Layer();
      
      const group = new Konva.Group({ 
        x: (containerW - canvasSettings.width * INITIAL_SCALE) / 2, 
        y: (containerH - canvasSettings.height * INITIAL_SCALE) / 2,
        scaleX: INITIAL_SCALE, 
        scaleY: INITIAL_SCALE,
        id: 'document_group'
      });
      
      const bgRect = new Konva.Rect({
        id: 'bg_rect', x: 0, y: 0, width: canvasSettings.width, height: canvasSettings.height, fill: '#ffffff',
        shadowColor: 'black', shadowBlur: 20, shadowOpacity: 0.1, shadowOffsetX: 0, shadowOffsetY: 10
      });
      group.add(bgRect);

      const tr = new Konva.Transformer({
        nodes: [], keepRatio: false,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right'],
        borderStroke: '#d6f300', anchorStroke: '#d6f300', anchorFill: '#000', anchorSize: 8,
      });
      
      layer.add(group);
      layer.add(tr);
      stage.add(layer);

      stageRef.current = stage;
      layerRef.current = layer;
      trRef.current = tr;
      elementsMapRef.current = { group, bgRect };

      window.addEventListener('resize', () => {
        if(stageRef.current && containerRef.current) {
          stageRef.current.width(containerRef.current.offsetWidth);
          stageRef.current.height(containerRef.current.offsetHeight);
        }
      });

      stage.on('wheel', (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const oldScale = group.scaleX();
        const pointer = stage.getPointerPosition();
        
        const mousePointTo = {
          x: (pointer.x - group.x()) / oldScale,
          y: (pointer.y - group.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        group.scale({ x: newScale, y: newScale });
        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
        group.position(newPos);
        layer.batchDraw();
      });

      let isPanning = false;
      let lastPos = {x:0, y:0};
      stage.on('mousedown', (e) => {
        if (stateRef.current.activeTool === 'pan' || e.evt.button === 1 || e.evt.shiftKey) {
          isPanning = true;
          lastPos = stage.getPointerPosition();
        } else if (e.target === stage || e.target === bgRect) {
          setSelectedElementId(null);
        }
      });
      stage.on('mousemove', (e) => {
        if (!isPanning) return;
        const pos = stage.getPointerPosition();
        group.x(group.x() + (pos.x - lastPos.x));
        group.y(group.y() + (pos.y - lastPos.y));
        lastPos = pos;
        layer.batchDraw();
      });
      stage.on('mouseup', () => { isPanning = false; });
      stage.on('mouseleave', () => { isPanning = false; });

      const getLineGuideStops = () => {
        const cw = stateRef.current.canvasSettings.width;
        const ch = stateRef.current.canvasSettings.height;
        const vertical = [0, cw / 2, cw];
        const horizontal = [0, ch / 2, ch];
        return { vertical, horizontal };
      };

      const getGuides = (lineGuideStops, itemBounds) => {
        const resultV = [];
        const resultH = [];
        lineGuideStops.vertical.forEach((lineGuide) => {
          if (Math.abs(lineGuide - itemBounds.x) < 5) resultV.push({ lineGuide, diff: lineGuide - itemBounds.x, snap: 'start', offset: 0 });
          if (Math.abs(lineGuide - (itemBounds.x + itemBounds.width/2)) < 5) resultV.push({ lineGuide, diff: lineGuide - (itemBounds.x + itemBounds.width/2), snap: 'center', offset: itemBounds.width/2 });
          if (Math.abs(lineGuide - (itemBounds.x + itemBounds.width)) < 5) resultV.push({ lineGuide, diff: lineGuide - (itemBounds.x + itemBounds.width), snap: 'end', offset: itemBounds.width });
        });
        lineGuideStops.horizontal.forEach((lineGuide) => {
          if (Math.abs(lineGuide - itemBounds.y) < 5) resultH.push({ lineGuide, diff: lineGuide - itemBounds.y, snap: 'start', offset: 0 });
          if (Math.abs(lineGuide - (itemBounds.y + itemBounds.height/2)) < 5) resultH.push({ lineGuide, diff: lineGuide - (itemBounds.y + itemBounds.height/2), snap: 'center', offset: itemBounds.height/2 });
          if (Math.abs(lineGuide - (itemBounds.y + itemBounds.height)) < 5) resultH.push({ lineGuide, diff: lineGuide - (itemBounds.y + itemBounds.height), snap: 'end', offset: itemBounds.height });
        });
        const guides = [];
        const minV = resultV.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0];
        const minH = resultH.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0];
        if (minV) guides.push({ lineGuide: minV.lineGuide, offset: minV.offset, orientation: 'V', snap: minV.snap });
        if (minH) guides.push({ lineGuide: minH.lineGuide, offset: minH.offset, orientation: 'H', snap: minH.snap });
        return guides;
      };

      const drawGuides = (guides) => {
        guides.forEach((lg) => {
          const line = new Konva.Line({
            points: lg.orientation === 'H' ? [-6000, 0, 6000, 0] : [0, -6000, 0, 6000],
            stroke: 'rgb(0, 161, 255)', strokeWidth: 1, name: 'guideline', dash: [4, 6]
          });
          group.add(line);
          line.absolutePosition({
            x: lg.orientation === 'V' ? lg.lineGuide * group.scaleX() + group.x() : 0,
            y: lg.orientation === 'H' ? lg.lineGuide * group.scaleY() + group.y() : 0,
          });
          guideLinesRef.current.push(line);
        });
      };

      layer.on('dragmove', (e) => {
        guideLinesRef.current.forEach((l) => l.destroy());
        guideLinesRef.current = [];
        if (e.target === group) return;
        
        const lineGuideStops = getLineGuideStops();
        const itemBounds = { x: e.target.x(), y: e.target.y(), width: e.target.width() * e.target.scaleX(), height: e.target.height() * e.target.scaleY() };
        const guides = getGuides(lineGuideStops, itemBounds);
        
        if (!guides.length) return;
        drawGuides(guides);
        const absPos = e.target.absolutePosition();
        guides.forEach((lg) => {
          if (lg.orientation === 'V') absPos.x = lg.lineGuide * group.scaleX() + group.x() - lg.offset * group.scaleX();
          else absPos.y = lg.lineGuide * group.scaleY() + group.y() - lg.offset * group.scaleY();
        });
        e.target.absolutePosition(absPos);
      });

      layer.on('dragend', () => {
        guideLinesRef.current.forEach((l) => l.destroy());
        guideLinesRef.current = [];
      });
    }

    const { group, bgRect } = elementsMapRef.current;
    const stage = stageRef.current;
    
    stage.container().style.cursor = activeTool === 'pan' ? 'grab' : 'default';

    // 2. Sync Background & Dimensions dynamically
    bgRect.width(canvasSettings.width);
    bgRect.height(canvasSettings.height);
    bgRect.fill(canvasSettings.backgroundColor);
    if (canvasSettings.backgroundImage) {
      const img = new window.Image();
      img.src = canvasSettings.backgroundImage;
      img.onload = () => { 
        bgRect.fillPatternImage(img); 
        bgRect.fillPatternRepeat('no-repeat'); 
        bgRect.fillPatternScale({x: canvasSettings.width/img.width, y: canvasSettings.height/img.height}); 
        layerRef.current.batchDraw(); 
      };
    } else {
      bgRect.fillPatternImage(null);
    }

    // 3. Sync Elements
    const activeIds = new Set(elements.map(e => e.id));
    
    Object.keys(elementsMapRef.current).forEach(nodeId => {
      if (nodeId !== 'group' && nodeId !== 'bgRect' && !activeIds.has(nodeId)) {
        elementsMapRef.current[nodeId].destroy();
        delete elementsMapRef.current[nodeId];
      }
    });

    elements.forEach((el, index) => {
      let node = elementsMapRef.current[el.id];

      const commonAttrs = {
        x: el.x, y: el.y, width: el.width, height: el.height || 40,
        rotation: el.rotation || 0, draggable: activeTool === 'select', name: 'element'
      };

      if (!node) {
        if (el.type === 'text') node = new Konva.Text({ ...commonAttrs });
        else if (el.type === 'rectangle' || el.type === 'qr') node = new Konva.Rect({ ...commonAttrs });
        else if (el.type === 'line') node = new Konva.Line({ points: [0, 0, el.width, 0], x: el.x, y: el.y, draggable: true, name: 'element' });
        else if (el.type === 'image') node = new Konva.Image({ ...commonAttrs });

        if (node) {
          node.on('click tap', () => { if (stateRef.current.activeTool === 'select') setSelectedElementId(el.id); });
          node.on('dragend', (e) => updateElementState(el.id, { x: e.target.x(), y: e.target.y() }));
          node.on('transformend', (e) => {
            const n = e.target;
            updateElementState(el.id, {
              x: n.x(), y: n.y(),
              width: n.width() * n.scaleX(), height: n.height() * n.scaleY(), rotation: n.rotation()
            });
            n.setAttrs({ width: n.width() * n.scaleX(), height: n.height() * n.scaleY(), scaleX: 1, scaleY: 1 });
          });
          group.add(node);
          elementsMapRef.current[el.id] = node;
        }
      } else {
        node.draggable(activeTool === 'select');
        if (stateRef.current.selectedElementId !== el.id || (!node.isDragging() && !trRef.current.isTransforming())) {
          if (el.type !== 'line') node.setAttrs({ x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation || 0 });
          else node.setAttrs({ x: el.x, y: el.y, points: [0, 0, el.width, 0] });
        }
      }

      if (node) {
        try { node.setZIndex(index + 1); } catch (err) {}
        if (el.type === 'text') {
          node.setAttrs({
            text: el.text || 'Text', fontSize: el.fontSize, fontFamily: el.fontFamily,
            fontStyle: el.fontWeight === '700' ? 'bold' : 'normal', fill: el.color, align: el.align
          });
        }
        if (el.type === 'rectangle' || el.type === 'qr') {
          node.setAttrs({
            fill: el.type === 'qr' ? '#ffffff' : el.backgroundColor,
            stroke: el.borderColor, strokeWidth: el.borderWidth || 0
          });
        }
        if (el.type === 'line') node.setAttrs({ stroke: el.borderColor, strokeWidth: el.borderWidth || 2 });
        if (el.type === 'image' && el.src) {
          if (node.getAttr('srcUrl') !== el.src) {
            const img = new window.Image();
            img.crossOrigin = 'Anonymous';
            img.src = el.src;
            img.onload = () => { node.image(img); layerRef.current.batchDraw(); };
            node.setAttr('srcUrl', el.src);
          }
        }
      }
    });

    const tr = trRef.current;
    tr.moveToTop();
    if (selectedElementId && elementsMapRef.current[selectedElementId] && activeTool === 'select') {
      tr.nodes([elementsMapRef.current[selectedElementId]]);
    } else {
      tr.nodes([]);
    }

    layerRef.current.batchDraw();

  }, [elements, canvasSettings, loading, selectedElementId, activeTool]);

  const updateElementState = (id, changes) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...changes } : el));
  };

  const addElement = (type) => {
    let cx = canvasSettings.width / 2;
    let cy = canvasSettings.height / 2;
    if (elementsMapRef.current.group) {
      const g = elementsMapRef.current.group;
      const s = stageRef.current;
      cx = (s.width()/2 - g.x()) / g.scaleX();
      cy = (s.height()/2 - g.y()) / g.scaleY();
    }

    const newElement = {
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: cx - 100, y: cy - 20,
      width: 200, height: 40,
      text: type === 'text' ? 'New Text' : '',
      fontSize: 24, fontFamily: 'Arial', fontWeight: '400', color: '#000000', align: 'center',
      backgroundColor: type === 'rectangle' ? '#e5e7eb' : 'transparent',
      borderColor: type === 'rectangle' || type === 'line' ? '#000000' : 'transparent',
      borderWidth: type === 'line' ? 2 : 0,
      zIndex: elements.length + 1
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
  };

  const removeElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const changeZIndex = (id, direction) => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index < prev.length - 1) {
        const next = [...prev];
        [next[index], next[index+1]] = [next[index+1], next[index]];
        return next.map((el, i) => ({...el, zIndex: i + 1}));
      }
      if (direction === 'down' && index > 0) {
        const next = [...prev];
        [next[index], next[index-1]] = [next[index-1], next[index]];
        return next.map((el, i) => ({...el, zIndex: i + 1}));
      }
      return prev;
    });
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col bg-[#fcfcfc] text-[#0a0a0a] overflow-hidden font-sans relative z-[9999]">
      {/* Top Navigation */}
      <div className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/admin/templates" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="h-8 w-px bg-gray-200"></div>
          <input
            type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
            className="bg-transparent border-none outline-none font-black text-xl uppercase tracking-widest text-black w-96 placeholder:text-gray-300"
            placeholder="TEMPLATE NAME"
          />
        </div>
        <div className="flex items-center gap-4">
          <select value={documentType} onChange={handleDocumentTypeChange} className="bg-white text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl border border-gray-200 outline-none hover:border-gray-300">
            <option value="certificate">Certificate (Landscape)</option>
            <option value="offerLetter">Offer Letter (Portrait)</option>
            <option value="lor">Recommendation (Portrait)</option>
            <option value="extendedOfferLetter">Extended Offer (Portrait)</option>
          </select>
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="accent-lime-500 w-4 h-4" /> Set as Default
          </label>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 disabled:opacity-50 transition-all ml-4 shadow-xl">
            <Save className="w-4 h-4 text-lime-400" /> {saving ? 'SAVING...' : 'SAVE TEMPLATE'}
          </button>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-2 shrink-0 z-40">
          <button onClick={() => setActiveTool('select')} className={`p-4 rounded-2xl group transition-all ${activeTool === 'select' ? 'bg-gray-100' : 'hover:bg-gray-50'}`} title="Select Tool (V)"><MousePointer2 className={`w-6 h-6 ${activeTool === 'select' ? 'text-black' : 'text-gray-400'}`} /></button>
          <button onClick={() => setActiveTool('pan')} className={`p-4 rounded-2xl group transition-all ${activeTool === 'pan' ? 'bg-gray-100' : 'hover:bg-gray-50'}`} title="Pan Tool (Space)"><Hand className={`w-6 h-6 ${activeTool === 'pan' ? 'text-black' : 'text-gray-400'}`} /></button>
          
          <div className="w-10 h-px bg-gray-200 my-2"></div>

          <button onClick={() => addElement('text')} className="p-4 hover:bg-gray-50 rounded-2xl group transition-all" title="Add Text"><Type className="w-6 h-6 text-gray-400 group-hover:text-black" /></button>
          <button onClick={() => addElement('rectangle')} className="p-4 hover:bg-gray-50 rounded-2xl group transition-all" title="Add Rectangle"><Square className="w-6 h-6 text-gray-400 group-hover:text-black" /></button>
          <button onClick={() => addElement('image')} className="p-4 hover:bg-gray-50 rounded-2xl group transition-all" title="Add Image"><ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-black" /></button>
          <button onClick={() => addElement('qr')} className="p-4 hover:bg-gray-50 rounded-2xl group transition-all" title="Add QR Code Placeholder"><QrCode className="w-6 h-6 text-gray-400 group-hover:text-black" /></button>
          
          <button onClick={() => setSelectedElementId(null)} className="p-4 hover:bg-gray-50 rounded-2xl group transition-all mt-auto" title="Canvas Settings"><Settings className="w-6 h-6 text-gray-400 group-hover:text-black" /></button>
        </div>

        {/* Center Canvas Workspace */}
        <div className="flex-1 bg-gray-100 overflow-hidden relative outline-none" tabIndex={0}>
          <div ref={containerRef} className="absolute inset-0" />
        </div>

        {/* Right Properties Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto shrink-0 z-40">
          {!selectedElement ? (
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2"><Settings className="w-3 h-3" /> CANVAS SETTINGS</h3>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Background Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={canvasSettings.backgroundColor || '#ffffff'} onChange={(e) => setCanvasSettings({...canvasSettings, backgroundColor: e.target.value})} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                  <input type="text" value={canvasSettings.backgroundColor || '#ffffff'} onChange={(e) => setCanvasSettings({...canvasSettings, backgroundColor: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-black" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Background Image URL</label>
                <input type="text" value={canvasSettings.backgroundImage || ''} onChange={(e) => setCanvasSettings({...canvasSettings, backgroundImage: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Background Gradient (CSS)</label>
                <input type="text" value={canvasSettings.backgroundGradient || ''} onChange={(e) => setCanvasSettings({...canvasSettings, backgroundGradient: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none font-mono focus:border-black" placeholder="linear-gradient(45deg, #0d0d0d, #222)" />
              </div>
              <div className="p-4 bg-lime-50 border border-lime-100 rounded-xl mt-8">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-lime-600 mb-2">Available Variables</h4>
                <div className="space-y-2 text-xs text-gray-500 font-mono">
                  <p>{'{{candidateName}}'}</p><p>{'{{position}}'}</p><p>{'{{department}}'}</p><p>{'{{startDate}}'}</p><p>{'{{certificateId}}'}</p><p>{'{{issuedBy}}'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black flex items-center gap-2"><Move className="w-3 h-3 text-lime-500" /> EDIT {selectedElement.type}</h3>
                <button onClick={() => removeElement(selectedElement.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors" title="Delete (Del)"><Trash2 className="w-4 h-4" /></button>
              </div>

              {/* Z-Index Controls */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2"><Layers className="w-3 h-3" /> Layer Depth</span>
                <div className="flex gap-2">
                  <button onClick={() => changeZIndex(selectedElement.id, 'down')} className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 text-gray-500" title="Send Backward"><ChevronDown className="w-4 h-4" /></button>
                  <button onClick={() => changeZIndex(selectedElement.id, 'up')} className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 text-gray-500" title="Bring Forward"><ChevronUp className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Position & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400">X</label><input type="number" value={Math.round(selectedElement.x)} onChange={(e) => updateElementState(selectedElement.id, { x: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400">Y</label><input type="number" value={Math.round(selectedElement.y)} onChange={(e) => updateElementState(selectedElement.id, { y: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400">WIDTH</label><input type="number" value={Math.round(selectedElement.width)} onChange={(e) => updateElementState(selectedElement.id, { width: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400">HEIGHT</label><input type="number" value={Math.round(selectedElement.height || 0)} onChange={(e) => updateElementState(selectedElement.id, { height: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" /></div>
              </div>

              {selectedElement.type === 'text' && (
                <>
                  <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400">TEXT</label><textarea value={selectedElement.text} onChange={(e) => updateElementState(selectedElement.id, { text: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black min-h-[80px]" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400">FONT SIZE</label><input type="number" value={selectedElement.fontSize} onChange={(e) => updateElementState(selectedElement.id, { fontSize: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400">WEIGHT</label><select value={selectedElement.fontWeight} onChange={(e) => updateElementState(selectedElement.id, { fontWeight: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black"><option value="400">Regular</option><option value="700">Bold</option></select></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Alignment</label>
                    <div className="flex gap-2">
                      <button onClick={() => updateElementState(selectedElement.id, { align: 'left' })} className={`p-2 rounded-lg flex-1 flex justify-center border transition-colors ${selectedElement.align === 'left' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-black'}`}><AlignLeft className="w-4 h-4" /></button>
                      <button onClick={() => updateElementState(selectedElement.id, { align: 'center' })} className={`p-2 rounded-lg flex-1 flex justify-center border transition-colors ${selectedElement.align === 'center' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-black'}`}><AlignCenter className="w-4 h-4" /></button>
                      <button onClick={() => updateElementState(selectedElement.id, { align: 'right' })} className={`p-2 rounded-lg flex-1 flex justify-center border transition-colors ${selectedElement.align === 'right' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-black'}`}><AlignRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                </>
              )}

              {selectedElement.type === 'image' && (
                <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400">IMAGE URL</label><input type="text" value={selectedElement.src || ''} onChange={(e) => updateElementState(selectedElement.id, { src: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" /></div>
              )}

              {/* Colors */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {selectedElement.type === 'text' && (
                  <div className="flex items-center gap-3"><input type="color" value={selectedElement.color} onChange={(e) => updateElementState(selectedElement.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" /><span className="text-[10px] font-bold text-gray-500">TEXT COLOR</span></div>
                )}
                {['rectangle'].includes(selectedElement.type) && (
                  <div className="flex items-center gap-3"><input type="color" value={selectedElement.backgroundColor} onChange={(e) => updateElementState(selectedElement.id, { backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" /><span className="text-[10px] font-bold text-gray-500">FILL COLOR</span></div>
                )}
                {['rectangle', 'line'].includes(selectedElement.type) && (
                  <>
                    <div className="flex items-center gap-3"><input type="color" value={selectedElement.borderColor} onChange={(e) => updateElementState(selectedElement.id, { borderColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" /><span className="text-[10px] font-bold text-gray-500">STROKE COLOR</span></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400">STROKE THICKNESS</label><input type="number" value={selectedElement.borderWidth} onChange={(e) => updateElementState(selectedElement.id, { borderWidth: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" /></div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
