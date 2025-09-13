import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Banner {
  _id: string;
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  displayType: 'carousel' | 'price-range';
  categoryId?: string;
  priceRange?: {
    minPrice?: number;
    maxPrice?: number;
    label: string;
    color?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BannerResponse {
  success: boolean;
  message: string;
  data: Banner[];
}

// Island and shopping themed banners with light colors
const FALLBACK_BANNERS: Banner[] = [
  {
    _id: 'island1',
    id: 'island1',
    title: 'Island Paradise Shopping',
    subtitle: '',
    description: '',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIFNreSBncmFkaWVudCBiYWNrZ3JvdW5kIC0tPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJza3lHcmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjQwMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjRTZGM0ZGIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0IzRTBGRiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0id2F0ZXJHcmFkaWVudCIgeDE9IjAiIHkxPSIyNTAiIHgyPSIwIiB5Mj0iNDAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiM4N0NFRUIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDY4MkI0Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8IS0tIEJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3NreUdyYWRpZW50KSIvPgogIDwhLS0gV2F0ZXIgLS0+CiAgPHJlY3QgeD0iMCIgeT0iMjUwIiB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9InVybCgjd2F0ZXJHcmFkaWVudCkiLz4KICA8IS0tIENsb3VkcyAtLT4KICA8ZWxsaXBzZSBjeD0iMjAwIiBjeT0iODAiIHJ4PSI0MCIgcnk9IjIwIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC44Ii8+CiAgPGVsbGlwc2UgY3g9IjIyMCIgY3k9Ijc1IiByeD0iMzUiIHJ5PSIxOCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOCIvPgogIDxlbGxpcHNlIGN4PSIxODAiIGN5PSI3NSIgcng9IjMwIiByeT0iMTUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiLz4KICA8ZWxsaXBzZSBjeD0iODAwIiBjeT0iNjAiIHJ4PSI0NSIgcnk9IjIyIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC43Ii8+CiAgPGVsbGlwc2UgY3g9IjgyNSIgY3k9IjU1IiByeD0iMzgiIHJ5PSIyMCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNyIvPgogIDxlbGxpcHNlIGN4PSI3NzUiIGN5PSI1NSIgcng9IjMyIiByeT0iMTYiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjciLz4KICA8IS0tIElzbGFuZCAtLT4KICA8ZWxsaXBzZSBjeD0iNjAwIiBjeT0iMjgwIiByeD0iMjAwIiByeT0iNTAiIGZpbGw9IiNGNEU0QkMiLz4KICA8IS0tIFBhbG0gdHJlZXMgLS0+CiAgPHJlY3QgeD0iNTIwIiB5PSIyMDAiIHdpZHRoPSI4IiBoZWlnaHQ9IjgwIiBmaWxsPSIjOEI0NTEzIi8+CiAgPGVsbGlwc2UgY3g9IjUyNCIgY3k9IjE5MCIgcng9IjI1IiByeT0iMTUiIGZpbGw9IiMyMjhCMjIiLz4KICA8ZWxsaXBzZSBjeD0iNTM0IiBjeT0iMTg1IiByeD0iMjAiIHJ5PSIxMiIgZmlsbD0iIzIyOEIyMiIvPgogIDxlbGxpcHNlIGN4PSI1MTQiIGN5PSIxODUiIHJ4PSIyMCIgcnk9IjEyIiBmaWxsPSIjMjI4QjIyIi8+CiAgPHJlY3QgeD0iNjgwIiB5PSIyMTAiIHdpZHRoPSI4IiBoZWlnaHQ9IjcwIiBmaWxsPSIjOEI0NTEzIi8+CiAgPGVsbGlwc2UgY3g9IjY4NCIgY3k9IjIwMCIgcng9IjIyIiByeT0iMTMiIGZpbGw9IiMyMjhCMjIiLz4KICA8ZWxsaXBzZSBjeD0iNjkyIiBjeT0iMTk1IiByeD0iMTgiIHJ5PSIxMCIgZmlsbD0iIzIyOEIyMiIvPgogIDxlbGxpcHNlIGN4PSI2NzYiIGN5PSIxOTUiIHJ4PSIxOCIgcnk9IjEwIiBmaWxsPSIjMjI4QjIyIi8+CiAgPCEtLSBTaG9wcGluZyBiYWdzIG9uIGJlYWNoIC0tPgogIDxyZWN0IHg9IjU4MCIgeT0iMjYwIiB3aWR0aD0iMTUiIGhlaWdodD0iMjAiIGZpbGw9IiNGRkI2QzEiIHJ4PSIyIi8+CiAgPHJlY3QgeD0iNTgyIiB5PSIyNTgiIHdpZHRoPSIxMSIgaGVpZ2h0PSI0IiBmaWxsPSIjRkY2OUI0Ii8+CiAgPHJlY3QgeD0iNjIwIiB5PSIyNjUiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxNSIgZmlsbD0iIzk4RkI5OCIgcng9IjIiLz4KICA8cmVjdCB4PSI2MjEiIHk9IjI2MyIgd2lkdGg9IjEwIiBoZWlnaHQ9IjMiIGZpbGw9IiMzMkNEMzIiLz4KICA8IS0tIFN1biAtLT4KICA8Y2lyY2xlIGN4PSIxMDAwIiBjeT0iMTAwIiByPSI0MCIgZmlsbD0iI0ZGRDcwMCIgb3BhY2l0eT0iMC45Ii8+CiAgPCEtLSBXYXRlciByaXBwbGVzIC0tPgogIDxlbGxpcHNlIGN4PSIzMDAiIGN5PSIzMjAiIHJ4PSIzMCIgcnk9IjUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz4KICA8ZWxsaXBzZSBjeD0iOTAwIiBjeT0iMzQwIiByeD0iMjUiIHJ5PSI0IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4zIi8+CiAgPGVsbGlwc2UgY3g9IjE1MCIgY3k9IjM2MCIgcng9IjIwIiByeT0iMyIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIvPgo8L3N2Zz4=',
    link: '/products',
    buttonText: '',
    isActive: true,
    order: 1,
    displayType: 'carousel' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'island2',
    id: 'island2',
    title: 'Beach Shopping Resort',
    subtitle: '',
    description: '',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEJhY2tncm91bmQgZ3JhZGllbnQgLS0+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJlYWNoR3JhZGllbnQiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSI0MDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI0YwRjhGRiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjAuNSIgc3RvcC1jb2xvcj0iI0UwRjZGRiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNCMEUwRTYiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9Im9jZWFuR3JhZGllbnQiIHgxPSIwIiB5MT0iMzAwIiB4Mj0iMCIgeTI9IjQwMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjNDBFMEQwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwOEI4QiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPCEtLSBCYWNrZ3JvdW5kIC0tPgogIDxyZWN0IHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNiZWFjaEdyYWRpZW50KSIvPgogIDwhLS0gT2NlYW4gLS0+CiAgPHJlY3QgeD0iMCIgeT0iMzAwIiB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjb2NlYW5HcmFkaWVudCkiLz4KICA8IS0tIEJlYWNoIHNhbmQgLS0+CiAgPGVsbGlwc2UgY3g9IjYwMCIgY3k9IjM1MCIgcng9IjYwMCIgcnk9IjgwIiBmaWxsPSIjRjVERUIzIi8+CiAgPCEtLSBTaG9wcGluZyByZXNvcnQgYnVpbGRpbmdzIC0tPgogIDxyZWN0IHg9IjEwMCIgeT0iMTgwIiB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkZGQUNEIiByeD0iNSIvPgogIDxyZWN0IHg9IjExMCIgeT0iMTYwIiB3aWR0aD0iNjAiIGhlaWdodD0iMjAiIGZpbGw9IiNEREEwREQiLz4KICA8cmVjdCB4PSIxMjAiIHk9IjIwMCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjIwIiBmaWxsPSIjODdDRUVCIi8+CiAgPHJlY3QgeD0iMTQ1IiB5PSIyMDAiIHdpZHRoPSIxNSIgaGVpZ2h0PSIyMCIgZmlsbD0iIzg3Q0VFQiIvPgogIDxyZWN0IHg9IjEyMCIgeT0iMjQwIiB3aWR0aD0iMTUiIGhlaWdodD0iMjAiIGZpbGw9IiM4N0NFRUIiLz4KICA8cmVjdCB4PSIxNDUiIHk9IjI0MCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjIwIiBmaWxsPSIjODdDRUVCIi8+CiAgPHJlY3QgeD0iMjAwIiB5PSIyMDAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGMEU2OEMiIHJ4PSI1Ii8+CiAgPHJlY3QgeD0iMjEwIiB5PSIxODUiIHdpZHRoPSI0MCIgaGVpZ2h0PSIxNSIgZmlsbD0iI0ZGNjM0NyIvPgogIDxyZWN0IHg9IjIxNSIgeT0iMjIwIiB3aWR0aD0iMTIiIGhlaWdodD0iMTUiIGZpbGw9IiM4N0NFRUIiLz4KICA8cmVjdCB4PSIyMzUiIHk9IjIyMCIgd2lkdGg9IjEyIiBoZWlnaHQ9IjE1IiBmaWxsPSIjODdDRUVCIi8+CiAgPHJlY3QgeD0iMjE1IiB5PSIyNTAiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxNSIgZmlsbD0iIzg3Q0VFQiIvPgogIDxyZWN0IHg9IjIzNSIgeT0iMjUwIiB3aWR0aD0iMTIiIGhlaWdodD0iMTUiIGZpbGw9Ijg3Q0VFQiIvPgogIDwhLS0gU2hvcHBpbmcgY2VudGVyIC0tPgogIDxyZWN0IHg9IjkwMCIgeT0iMTUwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0ZGRjhEQyIgcng9IjgiLz4KICA8cmVjdCB4PSI5MTAiIHk9IjEzMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI0ZGNjlCNCIvPgogIDxyZWN0IHg9IjkyMCIgeT0iMTcwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjUiIGZpbGw9IiM4N0NFRUIiLz4KICA8cmVjdCB4PSI5NTAiIHk9IjE3MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjI1IiBmaWxsPSIjODdDRUVCIi8+CiAgPHJlY3QgeD0iOTgwIiB5PSIxNzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyNSIgZmlsbD0iIzg3Q0VFQiIvPgogIDxyZWN0IHg9IjkyMCIgeT0iMjEwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjUiIGZpbGw9IiM4N0NFRUIiLz4KICA8cmVjdCB4PSI5NTAiIHk9IjIxMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjI1IiBmaWxsPSIjODdDRUVCIi8+CiAgPHJlY3QgeD0iOTgwIiB5PSIyMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyNSIgZmlsbD0iIzg3Q0VFQiIvPgogIDwhLS0gUGFsbSB0cmVlcyAtLT4KICA8cmVjdCB4PSIzNTAiIHk9IjIyMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjOEI0NTEzIi8+CiAgPGVsbGlwc2UgY3g9IjM1NSIgY3k9IjIxMCIgcng9IjMwIiByeT0iMTgiIGZpbGw9IiMzMkNEMzIiLz4KICA8ZWxsaXBzZSBjeD0iMzY1IiBjeT0iMjA1IiByeD0iMjUiIHJ5PSIxNSIgZmlsbD0iIzMyQ0QzMiIvPgogIDxlbGxpcHNlIGN4PSIzNDUiIGN5PSIyMDUiIHJ4PSIyNSIgcnk9IjE1IiBmaWxsPSIjMzJDRDMyIi8+CiAgPHJlY3QgeD0iNzUwIiB5PSIyMDAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM4QjQ1MTMiLz4KICA8ZWxsaXBzZSBjeD0iNzU1IiBjeT0iMTkwIiByeD0iMjgiIHJ5PSIxNiIgZmlsbD0iIzMyQ0QzMiIvPgogIDxlbGxpcHNlIGN4PSI3NjMiIGN5PSIxODUiIHJ4PSIyMiIgcnk9IjEzIiBmaWxsPSIjMzJDRDMyIi8+CiAgPGVsbGlwc2UgY3g9Ijc0NyIgY3k9IjE4NSIgcng9IjIyIiByeT0iMTMiIGZpbGw9IiMzMkNEMzIiLz4KICA8IS0tIFNob3BwaW5nIGJhZ3MgYW5kIGJlYWNoIGl0ZW1zIC0tPgogIDxyZWN0IHg9IjUwMCIgeT0iMzIwIiB3aWR0aD0iMTgiIGhlaWdodD0iMjUiIGZpbGw9IiNGRkI2QzEiIHJ4PSIzIi8+CiAgPHJlY3QgeD0iNTAyIiB5PSIzMTgiIHdpZHRoPSIxNCIgaGVpZ2h0PSI1IiBmaWxsPSIjRkYxNDkzIi8+CiAgPHJlY3QgeD0iNTMwIiB5PSIzMjUiIHdpZHRoPSIxNSIgaGVpZ2h0PSIyMCIgZmlsbD0iIzk4RkI5OCIgcng9IjIiLz4KICA8cmVjdCB4PSI1MzEiIHk9IjMyMyIgd2lkdGg9IjEzIiBoZWlnaHQ9IjQiIGZpbGw9IiMwMEZGMDAiLz4KICA8Y2lyY2xlIGN4PSI1ODAiIGN5PSIzMzUiIHI9IjgiIGZpbGw9IiNGRjYzNDciLz4KICA8Y2lyY2xlIGN4PSI2MDAiIGN5PSIzNDAiIHI9IjYiIGZpbGw9IiNGRkQ3MDAiLz4KICA8IS0tIFNlYWd1bGxzIC0tPgogIDxwYXRoIGQ9Ik0gNDAwIDEyMCBRIDQwNSAxMTUgNDEwIDEyMCBRIDQxNSAxMTUgNDIwIDEyMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTSA4MDAgMTAwIFEgODA1IDk1IDgxMCAxMDAgUSA4MTUgOTUgODIwIDEwMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CiAgPCEtLSBXYXZlcyAtLT4KICA8ZWxsaXBzZSBjeD0iMjAwIiBjeT0iMzUwIiByeD0iNDAiIHJ5PSI4IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC40Ii8+CiAgPGVsbGlwc2UgY3g9IjYwMCIgY3k9IjM3MCIgcng9IjM1IiByeT0iNiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNCIvPgogIDxlbGxpcHNlIGN4PSIxMDAwIiBjeT0iMzYwIiByeD0iMzAiIHJ5PSI1IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC40Ii8+Cjwvc3ZnPg==',
    link: '/products',
    buttonText: '',
    isActive: true,
    order: 2,
    displayType: 'carousel' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'island3',
    id: 'island3',
    title: 'Tropical Shopping Village',
    subtitle: '',
    description: '',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEJhY2tncm91bmQgZ3JhZGllbnQgLS0+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InRyb3BpY2FsR3JhZGllbnQiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSI0MDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI0Y1RjVEQyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjAuNiIgc3RvcC1jb2xvcj0iI0U2RTZGQSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNEOEJGRDgiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImxhZ29vbkdyYWRpZW50IiB4MT0iMCIgeTE9IjI4MCIgeDI9IjAiIHkyPSI0MDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI0FGRUVFRSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzVGOUVBMCI+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8IS0tIEJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3Ryb3BpY2FsR3JhZGllbnQpIi8+CiAgPCEtLSBMYWdvb24gLS0+CiAgPHJlY3QgeD0iMCIgeT0iMjgwIiB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9InVybCgjbGFnb29uR3JhZGllbnQpIi8+CiAgPCEtLSBNdWx0aXBsZSBzbWFsbCBpc2xhbmRzIC0tPgogIDxlbGxpcHNlIGN4PSIyMDAiIGN5PSIzMDAiIHJ4PSI4MCIgcnk9IjI1IiBmaWxsPSIjREVCODg3Ii8+CiAgPGVsbGlwc2UgY3g9IjUwMCIgY3k9IjMxMCIgcng9IjEyMCIgcnk9IjM1IiBmaWxsPSIjREVCODg3Ii8+CiAgPGVsbGlwc2UgY3g9IjkwMCIgY3k9IjI5NSIgcng9IjEwMCIgcnk9IjMwIiBmaWxsPSIjREVCODg3Ii8+CiAgPCEtLSBTaG9wcGluZyB2aWxsYWdlIG9uIG1haW4gaXNsYW5kIC0tPgogIDxyZWN0IHg9IjQ1MCIgeT0iMjQwIiB3aWR0aD0iNDAiIGhlaWdodD0iNzAiIGZpbGw9IiNGRkVGRDUiIHJ4PSI0Ii8+CiAgPHBvbHlnb24gcG9pbnRzPSI0NTAsMjQwIDQ3MCwyMjAgNDkwLDI0MCIgZmlsbD0iI0NEODUzRiIvPgogIDxyZWN0IHg9IjQ2MCIgeT0iMjYwIiB3aWR0aD0iOCIgaGVpZ2h0PSIxMiIgZmlsbD0iIzhCNDUxMyIvPgogIDxyZWN0IHg9IjQ3NSIgeT0iMjU1IiB3aWR0aD0iNiIgaGVpZ2h0PSI4IiBmaWxsPSIjODdDRUVCIi8+CiAgPHJlY3QgeD0iNTAwIiB5PSIyNTAiIHdpZHRoPSIzNSIgaGVpZ2h0PSI2MCIgZmlsbD0iI0YwRTY4QyIgcng9IjMiLz4KICA8cG9seWdvbiBwb2ludHM9IjUwMCwyNTAgNTE3LDIzNSA1MzUsMjUwIiBmaWxsPSIjQjIyMjIyIi8+CiAgPHJlY3QgeD0iNTEwIiB5PSIyNzAiIHdpZHRoPSI3IiBoZWlnaHQ9IjEwIiBmaWxsPSIjOEI0NTEzIi8+CiAgPHJlY3QgeD0iNTIwIiB5PSIyNjUiIHdpZHRoPSI1IiBoZWlnaHQ9IjciIGZpbGw9IiM4N0NFRUIiLz4KICA8cmVjdCB4PSI1NDAiIHk9IjI0NSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjY1IiBmaWxsPSIjRkZGQUNEIiByeD0iMyIvPgogIDxwb2x5Z29uIHBvaW50cz0iNTQwLDI0NSA1NTUsMjMwIDU3MCwyNDUiIGZpbGw9IiNGRjYzNDciLz4KICA8cmVjdCB4PSI1NDgiIHk9IjI2NSIgd2lkdGg9IjYiIGhlaWdodD0iOSIgZmlsbD0iIzhCNDUxMyIvPgogIDxyZWN0IHg9IjU1NyIgeT0iMjYwIiB3aWR0aD0iNSIgaGVpZ2h0PSI2IiBmaWxsPSIjODdDRUVCIi8+CiAgPCEtLSBQYWxtIHRyZWVzIG9uIGlzbGFuZHMgLS0+CiAgPHJlY3QgeD0iMTgwIiB5PSIyNTAiIHdpZHRoPSI2IiBoZWlnaHQ9IjUwIiBmaWxsPSIjOEI0NTEzIi8+CiAgPGVsbGlwc2UgY3g9IjE4MyIgY3k9IjI0NSIgcng9IjE4IiByeT0iMTIiIGZpbGw9IiMyMjhCMjIiLz4KICA8ZWxsaXBzZSBjeD0iMTkwIiBjeT0iMjQyIiByeD0iMTUiIHJ5PSIxMCIgZmlsbD0iIzIyOEIyMiIvPgogIDxlbGxpcHNlIGN4PSIxNzYiIGN5PSIyNDIiIHJ4PSIxNSIgcnk9IjEwIiBmaWxsPSIjMjI4QjIyIi8+CiAgPHJlY3QgeD0iMjIwIiB5PSIyNjAiIHdpZHRoPSI2IiBoZWlnaHQ9IjQwIiBmaWxsPSIjOEI0NTEzIi8+CiAgPGVsbGlwc2UgY3g9IjIyMyIgY3k9IjI1NSIgcng9IjE2IiByeT0iMTEiIGZpbGw9IiMyMjhCMjIiLz4KICA8ZWxsaXBzZSBjeD0iMjI5IiBjeT0iMjUyIiByeD0iMTMiIHJ5PSI5IiBmaWxsPSIjMjI4QjIyIi8+CiAgPGVsbGlwc2UgY3g9IjIxNyIgY3k9IjI1MiIgcng9IjEzIiByeT0iOSIgZmlsbD0iIzIyOEIyMiIvPgogIDxyZWN0IHg9Ijg4MCIgeT0iMjQwIiB3aWR0aD0iOCIgaGVpZ2h0PSI1NSIgZmlsbD0iIzhCNDUxMyIvPgogIDxlbGxpcHNlIGN4PSI4ODQiIGN5PSIyMzUiIHJ4PSIyMCIgcnk9IjEzIiBmaWxsPSIjMjI4QjIyIi8+CiAgPGVsbGlwc2UgY3g9Ijg5MiIgY3k9IjIzMiIgcng9IjE2IiByeT0iMTEiIGZpbGw9IiMyMjhCMjIiLz4KICA8ZWxsaXBzZSBjeD0iODc2IiBjeT0iMjMyIiByeD0iMTYiIHJ5PSIxMSIgZmlsbD0iIzIyOEIyMiIvPgogIDxyZWN0IHg9IjkyMCIgeT0iMjUwIiB3aWR0aD0iNyIgaGVpZ2h0PSI0NSIgZmlsbD0iIzhCNDUxMyIvPgogIDxlbGxpcHNlIGN4PSI5MjMiIGN5PSIyNDUiIHJ4PSIxNyIgcnk9IjEyIiBmaWxsPSIjMjI4QjIyIi8+CiAgPGVsbGlwc2UgY3g9IjkzMCIgY3k9IjI0MiIgcng9IjE0IiByeT0iMTAiIGZpbGw9IiMyMjhCMjIiLz4KICA8ZWxsaXBzZSBjeD0iOTE2IiBjeT0iMjQyIiByeD0iMTQiIHJ5PSIxMCIgZmlsbD0iIzIyOEIyMiIvPgogIDwhLS0gU2hvcHBpbmcgYm9hdHMgLS0+CiAgPGVsbGlwc2UgY3g9IjM1MCIgY3k9IjM1MCIgcng9IjI1IiByeT0iOCIgZmlsbD0iI0YwRjhGRiIvPgogIDxyZWN0IHg9IjM0MCIgeT0iMzQ1IiB3aWR0aD0iMjAiIGhlaWdodD0iOCIgZmlsbD0iI0YwRjhGRiIvPgogIDxyZWN0IHg9IjM0OCIgeT0iMzQwIiB3aWR0aD0iNCIgaGVpZ2h0PSIxNSIgZmlsbD0iIzhCNDUxMyIvPgogIDxwb2x5Z29uIHBvaW50cz0iMzQ4LDMyNSAzNTIsMzI1IDM1MCwzNDAiIGZpbGw9IiNGRjY5QjQiLz4KICA8ZWxsaXBzZSBjeD0iNzUwIiBjeT0iMzYwIiByeD0iMzAiIHJ5PSIxMCIgZmlsbD0iI0ZGRkFDRCIvPgogIDxyZWN0IHg9IjczNSIgeT0iMzU1IiB3aWR0aD0iMzAiIGhlaWdodD0iMTAiIGZpbGw9IiNGRkZBQ0QiLz4KICA8cmVjdCB4PSI3NDgiIHk9IjM1MCIgd2lkdGg9IjQiIGhlaWdodD0iMTgiIGZpbGw9IiM4QjQ1MTMiLz4KICA8cG9seWdvbiBwb2ludHM9Ijc0OCwzMzIgNzUyLDMzMiA3NTAsMzUwIiBmaWxsPSIjOThGQjk4Ii8+CiAgPCEtLSBTaG9wcGluZyBiYWdzIG9uIGJvYXRzIC0tPgogIDxyZWN0IHg9IjM0NSIgeT0iMzQyIiB3aWR0aD0iNCIgaGVpZ2h0PSI1IiBmaWxsPSIjRkZCNkMxIi8+CiAgPHJlY3QgeD0iMzUyIiB5PSIzNDMiIHdpZHRoPSIzIiBoZWlnaHQ9IjQiIGZpbGw9IiM5OEZCOTgiLz4KICA8cmVjdCB4PSI3NDIiIHk9IjM1MiIgd2lkdGg9IjUiIGhlaWdodD0iNiIgZmlsbD0iI0ZGRDcwMCIvPgogIDxyZWN0IHg9Ijc1MCIgeT0iMzUzIiB3aWR0aD0iNCIgaGVpZ2h0PSI1IiBmaWxsPSIjRkY2MzQ3Ii8+CiAgPCEtLSBUcm9waWNhbCBmbG93ZXJzIC0tPgogIDxjaXJjbGUgY3g9IjQ3MCIgY3k9IjI5MCIgcj0iMyIgZmlsbD0iI0ZGNjlCNCIvPgogIDxjaXJjbGUgY3g9IjUyMCIgY3k9IjI5NSIgcj0iMyIgZmlsbD0iI0ZGRDcwMCIvPgogIDxjaXJjbGUgY3g9IjU1MCIgY3k9IjI4NSIgcj0iMyIgZmlsbD0iI0ZGNjM0NyIvPgogIDxjaXJjbGUgY3g9IjE5MCIgY3k9IjI4NSIgcj0iMiIgZmlsbD0iI0ZGMTQ5MyIvPgogIDxjaXJjbGUgY3g9IjIxMCIgY3k9IjI5MCIgcj0iMiIgZmlsbD0iI0ZGNDUwMCIvPgogIDxjaXJjbGUgY3g9Ijg5MCIgY3k9IjI3NSIgcj0iMyIgZmlsbD0iI0RBNzBENiIvPgogIDxjaXJjbGUgY3g9IjkxMCIgY3k9IjI4MCIgcj0iMyIgZmlsbD0iI0ZGQjZDMSIvPgogIDwhLS0gR2VudGxlIHdhdmVzIC0tPgogIDxlbGxpcHNlIGN4PSIxMDAiIGN5PSIzNzAiIHJ4PSIyNSIgcnk9IjUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjUiLz4KICA8ZWxsaXBzZSBjeD0iNDAwIiBjeT0iMzgwIiByeD0iMzAiIHJ5PSI2IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC41Ii8+CiAgPGVsbGlwc2UgY3g9IjcwMCIgY3k9IjM3NSIgcng9IjI4IiByeT0iNSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNSIvPgogIDxlbGxpcHNlIGN4PSIxMTAwIiBjeT0iMzg1IiByeD0iMjIiIHJ5PSI0IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC41Ii8+CiAgPCEtLSBCdXR0ZXJmbGllcyAtLT4KICA8ZWxsaXBzZSBjeD0iMzAwIiBjeT0iMTUwIiByeD0iMyIgcnk9IjIiIGZpbGw9IiNGRjY5QjQiIHRyYW5zZm9ybT0icm90YXRlKDE1IDMwMCAxNTApIi8+CiAgPGVsbGlwc2UgY3g9IjMwNSIgY3k9IjE0OCIgcng9IjMiIHJ5PSIyIiBmaWxsPSIjRkY2OUI0IiB0cmFuc2Zvcm09InJvdGF0ZSgtMTUgMzA1IDE0OCkiLz4KICA8ZWxsaXBzZSBjeD0iODAwIiBjeT0iMTIwIiByeD0iMyIgcnk9IjIiIGZpbGw9IiNGRkQ3MDAiIHRyYW5zZm9ybT0icm90YXRlKDIwIDgwMCAxMjApIi8+CiAgPGVsbGlwc2UgY3g9IjgwNSIgY3k9IjExOCIgcng9IjMiIHJ5PSIyIiBmaWxsPSIjRkZENzAwIiB0cmFuc2Zvcm09InJvdGF0ZSgtMjAgODA1IDExOCkiLz4KPC9zdmc+',
    link: '/products',
    buttonText: '',
    isActive: true,
    order: 3,
    displayType: 'carousel' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class BannerService {
  private baseURL = `${API_BASE_URL}/banners`;
  private adminBaseURL = `${API_BASE_URL}/admin/banners`;
  private cache: { data: Banner[]; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache to reduce server load

  // Get active banners for frontend carousel with caching
  async getActiveBanners(forceRefresh = false): Promise<Banner[]> {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return this.cache.data;
    }

    try {
      const response = await axios.get<BannerResponse>(`${this.baseURL}/active`, {
        timeout: 5000 // Increased timeout to 5 seconds to prevent premature failures
      });
      
      const banners = response.data.data || [];


      
      // Cache successful response - always use API data, even if empty
      this.cache = {
        data: banners,
        timestamp: Date.now()
      };
      
      // Always return API data, even if empty - don't use fallback
      
      return banners;
    } catch (error: any) {

      // Try to return cached data first
      if (this.cache && this.cache.data.length > 0 && !this.cache.data[0].id.startsWith('fallback')) {
        
        return this.cache.data;
      }

      // Return empty array instead of fallback to force proper loading
      return [];
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache = null;
    // Also clear any localStorage cache
    try {
      localStorage.removeItem('bannerCache');
      localStorage.removeItem('banners');
    } catch (error) {
      
    }
  }

  // Admin methods (require authentication)
  async getAllBanners(page = 1, limit = 20): Promise<{ banners: Banner[]; pagination: any }> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${this.adminBaseURL}`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getBannerById(bannerId: string): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${this.adminBaseURL}/${bannerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async createBanner(bannerData: Partial<Banner>): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${this.adminBaseURL}`, bannerData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updateBanner(bannerId: string, bannerData: Partial<Banner>): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${this.adminBaseURL}/${bannerId}`, bannerData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deleteBanner(bannerId: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${this.adminBaseURL}/${bannerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      
      throw error;
    }
  }

  async updateBannerStatus(bannerId: string, isActive: boolean): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${this.adminBaseURL}/${bannerId}/status`, 
        { isActive }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async reorderBanners(bannerOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${this.adminBaseURL}/reorder`, 
        { bannerOrders }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      
      throw error;
    }
  }
}

export const bannerService = new BannerService();
export default bannerService;