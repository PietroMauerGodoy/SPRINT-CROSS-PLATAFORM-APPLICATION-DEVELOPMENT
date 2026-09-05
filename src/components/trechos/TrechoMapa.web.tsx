import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { KanbanItem, SeveridadeVegetacao } from '../../types';

const SEVERIDADE_COR: Record<SeveridadeVegetacao, string> = {
  sem_ocorrencia: '#7C3AED',
  leve: '#16A34A',
  grave: '#D97706',
  critico: '#DC2626',
};

type Props = {
  trechos: KanbanItem[];
  selecionadoId: string | null;
  onSelecionar: (item: KanbanItem) => void;
};

function temCoordenadaValida(t: KanbanItem): boolean {
  return typeof t.lat === 'number' && typeof t.lon === 'number' && !Number.isNaN(t.lat) && !Number.isNaN(t.lon);
}

export default function TrechoMapa({ trechos, selecionadoId, onSelecionar }: Props) {
  // Nunca confia cegamente no dado recebido — um item sem coordenada válida
  // (ex: dado antigo salvo antes de lat/lon existir) travaria o Leaflet com
  // "Invalid LatLng object: (NaN, NaN)" em vez de só não desenhar o marcador.
  const validos = trechos.filter(temCoordenadaValida);

  if (validos.length === 0) {
    return null;
  }

  const centroLat = validos.reduce((acc, t) => acc + t.lat, 0) / validos.length;
  const centroLon = validos.reduce((acc, t) => acc + t.lon, 0) / validos.length;

  return (
    <MapContainer
      center={[centroLat, centroLon]}
      zoom={9}
      style={{ width: '100%', height: '100%', borderRadius: 16 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validos.map((t) => {
        const ativo = t.id === selecionadoId;
        return (
          <CircleMarker
            key={t.id}
            center={[t.lat, t.lon]}
            radius={ativo ? 12 : 9}
            pathOptions={{
              color: '#fff',
              weight: ativo ? 3 : 2,
              fillColor: SEVERIDADE_COR[t.severidade],
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelecionar(t) }}
          >
            <Popup>
              <strong>{t.nomeEquipe}</strong>
              <br />
              {t.rodovia} · Km {t.kmInicio}-{t.kmFim}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
