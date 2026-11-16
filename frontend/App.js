import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Image, Alert, Platform, StatusBar as RNStatusBar,
  KeyboardAvoidingView, Keyboard, Modal, ActivityIndicator, Switch, Share
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Polygon, Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SplashScreen from 'expo-splash-screen';
import { useVideoPlayer, VideoView } from 'expo-video';

SplashScreen.preventAutoHideAsync().catch(() => {});

const VIDEO_INTRO = require('./assets/intro.mp4');

let AsyncStorage = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null;
}

const STORAGE_KEY_HISTORICO = '@raster_root:historico_talhoes_v1';

const POLIGONO_CHINA = [
  { latitude: 39.5, longitude: 73.6 },
  { latitude: 45.0, longitude: 80.0 },
  { latitude: 49.1, longitude: 87.3 },
  { latitude: 46.5, longitude: 90.5 },
  { latitude: 42.5, longitude: 96.0 },
  { latitude: 42.0, longitude: 105.0 },
  { latitude: 45.0, longitude: 112.0 },
  { latitude: 49.9, longitude: 119.5 },
  { latitude: 53.5, longitude: 123.5 },
  { latitude: 48.3, longitude: 134.8 },
  { latitude: 45.0, longitude: 131.5 },
  { latitude: 42.4, longitude: 130.6 },
  { latitude: 41.5, longitude: 127.0 },
  { latitude: 39.9, longitude: 124.2 },
  { latitude: 38.9, longitude: 121.6 },
  { latitude: 39.0, longitude: 118.0 },
  { latitude: 37.5, longitude: 122.7 },
  { latitude: 35.5, longitude: 119.6 },
  { latitude: 31.2, longitude: 121.9 },
  { latitude: 28.0, longitude: 121.3 },
  { latitude: 24.5, longitude: 118.1 },
  { latitude: 22.6, longitude: 114.2 },
  { latitude: 20.3, longitude: 110.3 },
  { latitude: 18.2, longitude: 109.5 },
  { latitude: 19.5, longitude: 108.6 },
  { latitude: 21.5, longitude: 108.0 },
  { latitude: 22.8, longitude: 106.0 },
  { latitude: 22.5, longitude: 103.5 },
  { latitude: 21.2, longitude: 101.3 },
  { latitude: 24.0, longitude: 97.6 },
  { latitude: 28.2, longitude: 97.4 },
  { latitude: 27.6, longitude: 92.0 },
  { latitude: 27.9, longitude: 88.9 },
  { latitude: 28.0, longitude: 86.0 },
  { latitude: 30.3, longitude: 81.2 },
  { latitude: 32.5, longitude: 78.5 },
  { latitude: 35.5, longitude: 76.0 },
  { latitude: 37.0, longitude: 74.9 },
];

const isCoordenadaNaChina = (latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (latitude < 18.0 || latitude > 53.7 || longitude < 73.4 || longitude > 135.0) {
    return false;
  }

  let dentro = false;
  const total = POLIGONO_CHINA.length;
  for (let i = 0, j = total - 1; i < total; j = i++) {
    const yi = POLIGONO_CHINA[i].latitude;
    const xi = POLIGONO_CHINA[i].longitude;
    const yj = POLIGONO_CHINA[j].latitude;
    const xj = POLIGONO_CHINA[j].longitude;

    const intersecta =
      (yi > latitude) !== (yj > latitude) &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;

    if (intersecta) dentro = !dentro;
  }
  return dentro;
};

const traducoes = {
  pt: {
    appName: "Raster Root",
    subtitleProp: "Cadastro da Propriedade",
    subtitleAnalise: "Análises & Estratégias",
    subtitleMapa: "Mapa & Camadas NASA",
    introTitle: "Planejamento da Área",
    introSubtitle: "Toque nos atalhos rápidos ou preencha os dados abaixo. Sua localização GPS e área serão enviadas para análise.",
    sec1: "1. Dimensões e Áreas (Hectares)",
    labelAreaTotal: "Área total da propriedade (ha) *",
    phAreaTotal: "Ex: 150",
    labelAreaPlantada: "Área total plantada / Talhão (ha) *",
    phAreaPlantada: "Ex: 120",
    labelAreaCriacao: "Área de criação / Pastagem (ha)",
    phAreaCriacao: "Ex: 30",
    sec2: "2. Cultivos e Manejo",
    labelCultivo: "Nome do Talhão / Cultivo principal *",
    phCultivo: "Ex: Talhão 01 - Soja",
    atalhosCultura: "Seleção rápida de cultura:",
    labelIrrigacao: "Possui sistema de irrigação ativa?",
    labelPrioridade: "Prioridade do Algoritmo:",
    prioBalanced: "Equilibrada",
    prioWater: "Conservação de Água",
    prioSoil: "Recuperação do Solo",
    emBreve: "Em breve",
    btnSalvar: "Analisar",
    alertObrigatorio: "Informe a Área Total e a Área Plantada para continuar.",
    alertErroArea: "A área plantada não pode ser maior que a área total!",
    navForm: "Questionário",
    navAnalise: "Análises",
    navMapa: "Mapa Satelital",
    climaTitulo: "Condições Climáticas (Telemetria NASA)",
    climaTag: "DADOS REAIS AZURE + NASA",
    chuvaTit: "Chuvas Acumuladas (mm)",
    tempTit: "Temperatura (°C)",
    soloTit: "Umidade do Solo",
    f7d: "7 Dias",
    f30d: "30 Dias",
    btnEditar: "Editar Dados",
    btnCompartilhar: "Compartilhar Relatório",
    camadaResumo: "Área & Score",
    camadaTemp: "Temperatura",
    camadaUmidade: "Umidade Solo",
    dicaMapa: "Toque no mapa ou grave caminhando (mín. 3 pontos)",
    pontosMarcados: "vértices",
    dicaArrastar: "Arraste os pinos para ajustar",
    btnDesfazer: "Desfazer",
    btnLimpar: "Limpar",
    btnConfirmarArea: "Analisar Área",
    btnGravarPerimetro: "Gravar Caminhada",
    btnPararPerimetro: "Parar Gravação",
    phBuscaMapa: "Buscar cidade, fazenda ou lat, lon...",
    modalSatTit: "Telemetria & Endpoints",
    modalSatSub: "Conexão Real Ativa (GPS + Azure + NASA)",
    modalHistTit: "Talhões Analisados (Offline)",
    modalHistSub: "Toque no talhão para ver a análise ou no ícone de mapa para localizar",
    semHistorico: "Nenhum talhão salvo ainda. Envie uma análise para criar seu histórico.",
    btnHistorico: "Talhões",
    btnSalvosMapa: "Salvos",
    verNoMapa: "Mapa",
    talhaoSalvoTitulo: "Talhão Salvo (Offline)",
    abrirAnalise: "Abrir Análise",
    centralizarMapa: "Centralizar",
    fechar: "Fechar",
    cancelar: "Cancelar",
    pularIntro: "Pular",
    loadingEtapa1: "1/3 Coletando telemetria orbital NASA...",
    loadingEtapa2: "2/3 Processando balanço hídrico e solo...",
    loadingEtapa3: "3/3 Gerando estratégias agronômicas...",
    apiRetornoTit: "Estratégias Geradas pelo Algoritmo",
    toqueDetalhes: "Toque em uma opção abaixo para ver critérios, pesos e gráficos",
    opcaoLabel: "Opção",
    scoreBadgeLabel: "Pontuação",
    scoreLabel: "Pontuação Final",
    confiancaLabel: "Confiança do Modelo",
    elegibilidadeLabel: "Viabilidade",
    indicadoresTitle: "Indicadores da Opção",
    criteriosTitle: "Detalhamento por Critério (Pesos & Notas):",
    comparativoTitle: "Comparativo de Pontuação entre as Opções",
    fatoresPositivosTitle: "Pontos Fortes / Vantagens:",
    riscosTitle: "Pontos de Atenção / Alertas:",
    semEstrategia: "Nenhuma estratégia gerada ainda. Envie os dados no Questionário ou desenhe o talhão no Mapa.",
    gpsAtivo: "GPS OK",
    gpsBuscando: "GPS...",
    indisponivelNasa: "Indisponível (NASA)",
    semLeituraSmap: "Aguardando leitura do satélite SMAP",
    umidadeBaixa: "Solo seco • Déficit hídrico",
    umidadeIdeal: "Umidade adequada • SMAP ativo",
    umidadeAlta: "Solo saturado • Alta umidade",
    pesoLabel: "Peso",
    areaCalculadaBadge: "Área calculada pelo mapa",
    restricaoChinaTit: "Região Restrita",
    restricaoChinaMsg: "Não é permitido marcar áreas, buscar locais ou realizar análises no território da China continental devido a restrições cartográficas e de cobertura."
  },
  en: {
    appName: "Raster Root",
    subtitleProp: "Property Registration",
    subtitleAnalise: "Analytics & Strategies",
    subtitleMapa: "Smart Map & NASA",
    introTitle: "Area Planning",
    introSubtitle: "Tap quick shortcuts or fill in the fields below. Your real GPS location and area will be analyzed.",
    sec1: "1. Dimensions & Areas (Hectares)",
    labelAreaTotal: "Total property area (ha) *",
    phAreaTotal: "Ex: 150",
    labelAreaPlantada: "Total planted / Plot area (ha) *",
    phAreaPlantada: "Ex: 120",
    labelAreaCriacao: "Livestock / Pasture area (ha)",
    phAreaCriacao: "Ex: 30",
    sec2: "2. Crops & Management",
    labelCultivo: "Plot Name / Main Crop *",
    phCultivo: "Ex: Plot 01 - Soy",
    atalhosCultura: "Quick crop selection:",
    labelIrrigacao: "Active irrigation system?",
    labelPrioridade: "Algorithm Priority:",
    prioBalanced: "Balanced",
    prioWater: "Water Conservation",
    prioSoil: "Soil Recovery",
    emBreve: "Soon",
    btnSalvar: "Analyze",
    alertObrigatorio: "Please provide the Total Area and Planted Area.",
    alertErroArea: "The planted area cannot be greater than the total area!",
    navForm: "Questionnaire",
    navAnalise: "Analytics",
    navMapa: "Satellite Map",
    climaTitulo: "Climate Conditions (NASA Telemetry)",
    climaTag: "REAL DATA AZURE + NASA",
    chuvaTit: "Accumulated Rainfall (mm)",
    tempTit: "Temperature (°C)",
    soloTit: "Soil Moisture",
    f7d: "7 Days",
    f30d: "30 Days",
    btnEditar: "Edit Data",
    btnCompartilhar: "Share Report",
    camadaResumo: "Area & Score",
    camadaTemp: "Temperature",
    camadaUmidade: "Soil Moisture",
    dicaMapa: "Tap map or walk perimeter (min. 3 points)",
    pontosMarcados: "vertices",
    dicaArrastar: "Drag pins to adjust",
    btnDesfazer: "Undo",
    btnLimpar: "Clear",
    btnConfirmarArea: "Analyze Area",
    btnGravarPerimetro: "Walk Perimeter",
    btnPararPerimetro: "Stop Recording",
    phBuscaMapa: "Search city, farm or lat, lon...",
    modalSatTit: "Telemetry & Endpoints",
    modalSatSub: "Active Real Connection (GPS + Azure + NASA)",
    modalHistTit: "Analyzed Plots (Offline)",
    modalHistSub: "Tap a plot to view analytics or the map icon to locate it on the map",
    semHistorico: "No saved plots yet. Run an analysis to build your offline history.",
    btnHistorico: "Plots",
    btnSalvosMapa: "Saved",
    verNoMapa: "Map",
    talhaoSalvoTitulo: "Saved Plot (Offline)",
    abrirAnalise: "Open Analytics",
    centralizarMapa: "Center Map",
    fechar: "Close",
    cancelar: "Cancel",
    pularIntro: "Skip",
    loadingEtapa1: "1/3 Fetching NASA orbital telemetry...",
    loadingEtapa2: "2/3 Processing water & soil balance...",
    loadingEtapa3: "3/3 Generating agronomic strategies...",
    apiRetornoTit: "Algorithm Generated Strategies",
    toqueDetalhes: "Tap an option below to view detailed criteria, weights and charts",
    opcaoLabel: "Option",
    scoreBadgeLabel: "Score",
    scoreLabel: "Final Score",
    confiancaLabel: "Model Confidence",
    elegibilidadeLabel: "Eligibility",
    indicadoresTitle: "Option Indicators",
    criteriosTitle: "Criteria Breakdown (Weights & Scores):",
    comparativoTitle: "Score Comparison Across Options",
    fatoresPositivosTitle: "Strengths / Advantages:",
    riscosTitle: "Attention Points / Alerts:",
    semEstrategia: "No strategy generated yet. Submit data in the Questionnaire or draw the plot on the Map.",
    gpsAtivo: "GPS OK",
    gpsBuscando: "GPS...",
    indisponivelNasa: "Unavailable (NASA)",
    semLeituraSmap: "Awaiting SMAP satellite reading",
    umidadeBaixa: "Dry soil • Water deficit",
    umidadeIdeal: "Optimal moisture • Active SMAP",
    umidadeAlta: "Saturated soil • High moisture",
    pesoLabel: "Weight",
    areaCalculadaBadge: "Area calculated from map",
    restricaoChinaTit: "Restricted Region",
    restricaoChinaMsg: "Marking areas, searching locations, or running analyses in Mainland China is not permitted due to mapping and coverage restrictions."
  }
};

const paresTraducaoFormulario = [
  { pt: 'Cana-de-açúcar', en: 'Sugarcane' },
  { pt: 'Cana-de-acucar', en: 'Sugarcane' },
  { pt: 'Cana de açúcar', en: 'Sugarcane' },
  { pt: 'Milho Safrinha', en: 'Second-crop Corn' },
  { pt: 'Talhão', en: 'Plot' },
  { pt: 'Talhao', en: 'Plot' },
  { pt: 'Fazenda', en: 'Farm' },
  { pt: 'Gleba', en: 'Field' },
  { pt: 'Lote', en: 'Lot' },
  { pt: 'Pastagem', en: 'Pasture' },
  { pt: 'Pasto', en: 'Pasture' },
  { pt: 'Safrinha', en: 'Second-crop' },
  { pt: 'Safra', en: 'Harvest' },
  { pt: 'Irrigado', en: 'Irrigated' },
  { pt: 'Sequeiro', en: 'Rainfed' },
  { pt: 'Soja', en: 'Soy' },
  { pt: 'Milho', en: 'Corn' },
  { pt: 'Algodão', en: 'Cotton' },
  { pt: 'Algodao', en: 'Cotton' },
  { pt: 'Café', en: 'Coffee' },
  { pt: 'Cafe', en: 'Coffee' },
  { pt: 'Braquiária', en: 'Brachiaria' },
  { pt: 'Braquiaria', en: 'Brachiaria' },
  { pt: 'Crotalária', en: 'Crotalaria' },
  { pt: 'Crotalaria', en: 'Crotalaria' },
  { pt: 'Feijão', en: 'Beans' },
  { pt: 'Feijao', en: 'Beans' },
  { pt: 'Sorgo', en: 'Sorghum' },
  { pt: 'Milheto', en: 'Millet' },
  { pt: 'Trigo', en: 'Wheat' },
  { pt: 'Aveia', en: 'Oats' },
  { pt: 'Arroz', en: 'Rice' },
  { pt: 'Girassol', en: 'Sunflower' },
  { pt: 'Amendoim', en: 'Peanut' },
  { pt: 'c/', en: 'w/' },
  { pt: 'com', en: 'with' },
];

const escaparRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const traduzirCampoFormulario = (texto, idiomaDestino) => {
  if (!texto || typeof texto !== 'string') return texto;
  let resultado = texto;

  for (const par of paresTraducaoFormulario) {
    const origem = idiomaDestino === 'en' ? par.pt : par.en;
    const destino = idiomaDestino === 'en' ? par.en : par.pt;
    if (origem.toLowerCase() === destino.toLowerCase()) continue;

    const regex = new RegExp(
      `(^|[^a-zA-ZÀ-ÿ0-9_])${escaparRegex(origem)}(?=$|[^a-zA-ZÀ-ÿ0-9_])`,
      'gi'
    );

    resultado = resultado.replace(regex, (match, prefixo) => {
      const trechoOriginal = match.slice(prefixo.length);
      const primeiraLetra = trechoOriginal.charAt(0);
      const ehMaiuscula =
        primeiraLetra &&
        primeiraLetra === primeiraLetra.toUpperCase() &&
        primeiraLetra !== primeiraLetra.toLowerCase();

      const substituicao = ehMaiuscula
        ? destino.charAt(0).toUpperCase() + destino.slice(1)
        : destino.charAt(0).toLowerCase() + destino.slice(1);

      return prefixo + substituicao;
    });
  }

  return resultado;
};

function IntroVideoScreen({ onFinish, labelPular }) {
  const finalizadoRef = useRef(false);
  const [mostrarBotaoPular, setMostrarBotaoPular] = useState(true);

  const encerrarIntro = () => {
    if (finalizadoRef.current) return;
    finalizadoRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
    onFinish();
  };

  const player = useVideoPlayer(VIDEO_INTRO, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    const timerSplash = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 300);

    setMostrarBotaoPular(true);

    const timeoutMaximo = setTimeout(() => {
      encerrarIntro();
    }, 12000);

    if (!player) {
      return () => {
        clearTimeout(timerSplash);
        clearTimeout(timeoutMaximo);
      };
    }

    const subStatus = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') {
        SplashScreen.hideAsync().catch(() => {});
        try {
          player.play();
        } catch {}
      }
      if (status === 'error' || error) {
        encerrarIntro();
      }
    });

    const subFim = player.addListener('playToEnd', () => {
      encerrarIntro();
    });

    return () => {
      clearTimeout(timerSplash);
      clearTimeout(timeoutMaximo);
      subStatus.remove();
      subFim.remove();
    };
  }, [player]);

  return (
    <View style={styles.introVideoContainer}>
      <StatusBar style="light" backgroundColor="#000000" translucent />
      <VideoView
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]}
        player={player}
        contentFit="contain"
        surfaceType="textureView"
        nativeControls={false}
        allowsFullscreen={false}
      />

      {mostrarBotaoPular && (
        <View style={styles.introVideoFooter}>
          <TouchableOpacity style={styles.skipIntroBtn} onPress={encerrarIntro}>
            <Text style={styles.skipIntroBtnText}>{labelPular}</Text>
            <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const nomesCriterios = {
  water: { pt: 'Água', en: 'Water' },
  climate: { pt: 'Clima', en: 'Climate' },
  erosion: { pt: 'Erosão', en: 'Erosion' },
  soil: { pt: 'Solo', en: 'Soil' },
  diversity: { pt: 'Diversidade', en: 'Diversity' },
  cover: { pt: 'Cobertura do Solo', en: 'Soil Cover' },
  operation: { pt: 'Operação', en: 'Operation' },
  economic: { pt: 'Econômico', en: 'Economic' },
};

const culturasRapidas = {
  pt: ['Soja', 'Milho', 'Algodão', 'Café', 'Cana-de-açúcar', 'Pastagem'],
  en: ['Soy', 'Corn', 'Cotton', 'Coffee', 'Sugarcane', 'Pasture']
};

const ehValorValidoNasa = (val) => typeof val === 'number' && !isNaN(val) && val > -900;

const calcularAreaHectares = (coordenadas) => {
  if (!coordenadas || coordenadas.length < 3) return 0;
  const R = 6378137;
  let area = 0;
  const total = coordenadas.length;
  for (let i = 0; i < total; i++) {
    const p1 = coordenadas[i];
    const p2 = coordenadas[(i + 1) % total];
    const lat1 = (p1.latitude * Math.PI) / 180;
    const lat2 = (p2.latitude * Math.PI) / 180;
    const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
    area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  const areaMetrosQuadrados = Math.abs((area * R * R) / 2);
  return Number((areaMetrosQuadrados / 10000).toFixed(2));
};

const calcularDistanciaMetros = (p1, p2) => {
  const R = 6371000;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calcularCentroCoordenadas = (coordenadas, fallback = null) => {
  if (!coordenadas || coordenadas.length === 0) return fallback;
  const somaLat = coordenadas.reduce((acc, p) => acc + p.latitude, 0);
  const somaLon = coordenadas.reduce((acc, p) => acc + p.longitude, 0);
  return {
    latitude: somaLat / coordenadas.length,
    longitude: somaLon / coordenadas.length,
  };
};

export default function App() {
  const [idioma, setIdioma] = useState('pt');
  const t = traducoes[idioma];

  const [mostrandoIntro, setMostrandoIntro] = useState(true);
  const [telaAtiva, setTelaAtiva] = useState('propriedade');
  const [modalSatelitesVisivel, setModalSatelitesVisivel] = useState(false);
  const [modalHistoricoVisivel, setModalHistoricoVisivel] = useState(false);

  const [carregandoApi, setCarregandoApi] = useState(false);
  const [etapaLoading, setEtapaLoading] = useState(1);
  const abortControllerRef = useRef(null);

  const mapRef = useRef(null);
  const watchGpsRef = useRef(null);
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null);
  const [statusGps, setStatusGps] = useState('buscando');
  const [gravandoPerimetro, setGravandoPerimetro] = useState(false);
  const [buscaMapa, setBuscaMapa] = useState('');
  const [buscandoLocal, setBuscandoLocal] = useState(false);

  const regiaoInicial = {
    latitude: -19.7472,
    longitude: -47.9381,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  const [camadaAtiva, setCamadaAtiva] = useState('resumo');
  const [pontosPoligono, setPontosPoligono] = useState([]);
  const [mostrarTalhoesSalvos, setMostrarTalhoesSalvos] = useState(true);

  const [areaTotal, setAreaTotal] = useState('');
  const [areaPlantada, setAreaPlantada] = useState('');
  const [areaCriacao, setAreaCriacao] = useState('');
  const [cultivoEspecifico, setCultivoEspecifico] = useState('');
  const [temIrrigacao, setTemIrrigacao] = useState(true);
  const [prioridadeVisual, setPrioridadeVisual] = useState('Balanced');

  const [periodo, setPeriodo] = useState('30d');
  const [resultadoApi, setResultadoApi] = useState(null);
  const [estrategiaSelecionadaIdx, setEstrategiaSelecionadaIdx] = useState(0);
  const [historicoTalhoes, setHistoricoTalhoes] = useState([]);

  const areaPoligonoHa = calcularAreaHectares(pontosPoligono);

  const alternarIdiomaApp = () => {
    const novoIdioma = idioma === 'pt' ? 'en' : 'pt';
    setIdioma(novoIdioma);
    setCultivoEspecifico((prev) => traduzirCampoFormulario(prev, novoIdioma));
  };

  const exibirAlertaRestricaoChina = () => {
    Alert.alert(t.restricaoChinaTit, t.restricaoChinaMsg);
  };

  const focarCoordenadaNoMapa = (latitude, longitude, delta = 0.015) => {
    setTimeout(() => {
      if (mapRef.current?.animateToRegion) {
        mapRef.current.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: delta,
            longitudeDelta: delta,
          },
          650
        );
      }
    }, 250);
  };

  useEffect(() => {
    obterLocalizacaoReal();
    carregarHistoricoOffline();
    return () => {
      pararGravacaoPerimetro();
    };
  }, []);

  useEffect(() => {
    if (!carregandoApi) {
      setEtapaLoading(1);
      return;
    }
    const timer1 = setTimeout(() => setEtapaLoading(2), 2500);
    const timer2 = setTimeout(() => setEtapaLoading(3), 6000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [carregandoApi]);

  const carregarHistoricoOffline = async () => {
    if (!AsyncStorage) return;
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_KEY_HISTORICO);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) setHistoricoTalhoes(parsed);
      }
    } catch {}
  };

  const salvarNoHistoricoOffline = async (novoRegistro) => {
    const atualizado = [novoRegistro, ...historicoTalhoes].slice(0, 20);
    setHistoricoTalhoes(atualizado);
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(atualizado));
    } catch {}
  };

  const removerDoHistoricoOffline = async (idLocal) => {
    const atualizado = historicoTalhoes.filter((item) => item.idLocal !== idLocal);
    setHistoricoTalhoes(atualizado);
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(atualizado));
    } catch {}
  };

  const restaurarTalhaoDoHistorico = (item, destinoTela = 'analise') => {
    if (isCoordenadaNaChina(item.latitude, item.longitude)) {
      exibirAlertaRestricaoChina();
      return;
    }
    setResultadoApi(item.respostaApi);
    setEstrategiaSelecionadaIdx(0);
    if (item.areaName) {
      setCultivoEspecifico(traduzirCampoFormulario(item.areaName, idioma));
    }
    if (item.areaHectares) {
      setAreaPlantada(String(item.areaHectares));
      if (!areaTotal || parseFloat(areaTotal) < parseFloat(item.areaHectares)) {
        setAreaTotal(String(item.areaHectares));
      }
    }
    if (typeof item.hasIrrigation === 'boolean') setTemIrrigacao(item.hasIrrigation);

    const poligonoSalvo = Array.isArray(item.poligono) ? item.poligono : [];
    setPontosPoligono(poligonoSalvo);

    const pontoAlvo = poligonoSalvo.length >= 3
      ? calcularCentroCoordenadas(poligonoSalvo, { latitude: item.latitude, longitude: item.longitude })
      : { latitude: item.latitude, longitude: item.longitude };

    setModalHistoricoVisivel(false);
    setMostrarTalhoesSalvos(true);
    setTelaAtiva(destinoTela);

    if (pontoAlvo && typeof pontoAlvo.latitude === 'number') {
      focarCoordenadaNoMapa(pontoAlvo.latitude, pontoAlvo.longitude, 0.012);
    }
  };

  const obterLocalizacaoReal = async () => {
    setStatusGps('buscando');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusGps('erro');
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coordsReais = {
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
      };

      if (isCoordenadaNaChina(coordsReais.latitude, coordsReais.longitude)) {
        setStatusGps('erro');
        exibirAlertaRestricaoChina();
        return;
      }

      setLocalizacaoAtual(coordsReais);
      focarCoordenadaNoMapa(coordsReais.latitude, coordsReais.longitude, 0.015);
      setStatusGps('ativo');
    } catch {
      setStatusGps('erro');
    }
  };

  const alternarGravacaoPerimetro = async () => {
    if (gravandoPerimetro) {
      pararGravacaoPerimetro();
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS', idioma === 'pt' ? 'Permissão de localização negada.' : 'Location permission denied.');
        return;
      }

      setGravandoPerimetro(true);
      watchGpsRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
          distanceInterval: 8,
        },
        (loc) => {
          const novoPonto = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };

          if (isCoordenadaNaChina(novoPonto.latitude, novoPonto.longitude)) {
            pararGravacaoPerimetro();
            exibirAlertaRestricaoChina();
            return;
          }

          setLocalizacaoAtual(novoPonto);
          setPontosPoligono((prev) => {
            if (prev.length === 0) return [novoPonto];
            const ultimo = prev[prev.length - 1];
            if (calcularDistanciaMetros(ultimo, novoPonto) >= 8) {
              return [...prev, novoPonto];
            }
            return prev;
          });
          mapRef.current?.animateToRegion?.(
            {
              latitude: novoPonto.latitude,
              longitude: novoPonto.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            },
            400
          );
        }
      );
    } catch {
      setGravandoPerimetro(false);
    }
  };

  const pararGravacaoPerimetro = () => {
    if (watchGpsRef.current) {
      watchGpsRef.current.remove();
      watchGpsRef.current = null;
    }
    setGravandoPerimetro(false);
  };

  const handleBuscarLocalMapa = async () => {
    const termo = buscaMapa.trim();
    if (!termo) return;
    Keyboard.dismiss();

    const matchCoord = termo.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
    if (matchCoord) {
      const lat = parseFloat(matchCoord[1]);
      const lon = parseFloat(matchCoord[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        if (isCoordenadaNaChina(lat, lon)) {
          exibirAlertaRestricaoChina();
          return;
        }
        focarCoordenadaNoMapa(lat, lon, 0.015);
        return;
      }
    }

    setBuscandoLocal(true);
    try {
      const resultados = await Location.geocodeAsync(termo);
      if (resultados && resultados.length > 0) {
        const alvo = resultados[0];
        let bloqueadoChina = isCoordenadaNaChina(alvo.latitude, alvo.longitude);

        if (!bloqueadoChina) {
          try {
            const reverso = await Location.reverseGeocodeAsync({
              latitude: alvo.latitude,
              longitude: alvo.longitude,
            });
            if (reverso?.[0]?.isoCountryCode === 'CN') {
              bloqueadoChina = true;
            }
          } catch {}
        }

        setBuscandoLocal(false);
        if (bloqueadoChina) {
          exibirAlertaRestricaoChina();
          return;
        }

        focarCoordenadaNoMapa(alvo.latitude, alvo.longitude, 0.03);
      } else {
        setBuscandoLocal(false);
        Alert.alert(
          idioma === 'pt' ? 'Local não encontrado' : 'Location not found',
          idioma === 'pt' ? 'Tente informar cidade/estado ou coordenadas (ex: -18.91, -48.27).' : 'Try a city/state or coordinates (ex: -18.91, -48.27).'
        );
      }
    } catch {
      setBuscandoLocal(false);
      Alert.alert(
        idioma === 'pt' ? 'Busca indisponível' : 'Search unavailable',
        idioma === 'pt' ? 'Sem conexão para buscar endereços. Você ainda pode digitar latitude, longitude.' : 'No connection for address search. You can still enter latitude, longitude.'
      );
    }
  };

  const obterCoordenadaParaApi = () => {
    if (pontosPoligono.length >= 3) {
      const centro = calcularCentroCoordenadas(pontosPoligono);
      return {
        latitude: Number(centro.latitude.toFixed(6)),
        longitude: Number(centro.longitude.toFixed(6)),
      };
    }
    if (localizacaoAtual) {
      return {
        latitude: Number(localizacaoAtual.latitude.toFixed(6)),
        longitude: Number(localizacaoAtual.longitude.toFixed(6)),
      };
    }
    return {
      latitude: regiaoInicial.latitude,
      longitude: regiaoInicial.longitude,
    };
  };

  const formatarPrioridade = (valorApi) => {
    if (!valorApi) return '';
    const mapa = {
      Balanced: t.prioBalanced,
      WaterConservation: t.prioWater,
      SoilRecovery: t.prioSoil,
    };
    return mapa[valorApi] || valorApi;
  };

  const formatarViabilidade = (valorApi) => {
    if (!valorApi) return '-';
    if (idioma === 'en') {
      const mapaEn = {
        'Viable': 'Viable',
        'ViableWithCaveats': 'Viable with Caveats',
        'NotViable': 'Not Viable',
        'Ineligible': 'Ineligible'
      };
      return mapaEn[valorApi] || valorApi;
    }
    const mapaPt = {
      'Viable': 'Viável',
      'ViableWithCaveats': 'Viável com Ressalvas',
      'NotViable': 'Inviável',
      'Ineligible': 'Inelegível'
    };
    return mapaPt[valorApi] || valorApi;
  };

  const formatarNomeCriterio = (chave) => {
    if (!chave) return '';
    const normalizado = chave.toLowerCase().trim();
    return nomesCriterios[normalizado]?.[idioma] || chave;
  };

  const traduzirTextoApi = (texto) => {
    if (!texto) return '';
    let txt = typeof texto === 'object' ? JSON.stringify(texto) : String(texto);
    if (idioma === 'pt') {
      txt = txt
        .replace(/\bRotacao atual\b/g, 'Rotação atual')
        .replace(/\brotacao atual\b/gi, 'rotação atual')
        .replace(/\bRotacao\b/g, 'Rotação')
        .replace(/\brotacao\b/gi, 'rotação')
        .replace(/\bbraquiaria\b/g, 'braquiária')
        .replace(/\bcrotalaria\b/g, 'crotalária')
        .replace(/\balgodao\b/g, 'algodão')
        .replace(/\bfeijao\b/g, 'feijão')
        .replace(/\bConservative\b/g, 'Conservadora')
        .replace(/\bRegenerative\b/g, 'Regenerativa')
        .replace(/\bCurrent rotation\b/gi, 'Rotação atual')
        .replace(/\bsecond-crop corn\b/gi, 'milho safrinha')
        .replace(/\bsoy\b/gi, 'soja')
        .replace(/\bcorn\b/gi, 'milho')
        .replace(/\bbrachiaria\b/gi, 'braquiária')
        .replace(/\bcrotalaria\b/gi, 'crotalária')
        .replace(/\bwith\b/gi, 'com')
        .replace(/\bwater\b/gi, 'água')
        .replace(/\bsoil\b/gi, 'solo')
        .replace(/\bclimate\b/gi, 'clima')
        .replace(/\berosion\b/gi, 'erosão')
        .replace(/\boperation\b/gi, 'operação')
        .replace(/\bdiversity\b/gi, 'diversidade')
        .replace(/\bcover\b/gi, 'cobertura')
        .replace(/\beconomic\b/gi, 'econômico')
        .replace(/Performance of/gi, 'Desempenho de');
    } else {
      txt = txt
        .replace(/\bConservadora\b/g, 'Conservative')
        .replace(/\bRegenerativa\b/g, 'Regenerative')
        .replace(/\bRota[çc][ãa]o atual\b/gi, 'Current rotation')
        .replace(/\bTalh[ãa]o\b/gi, 'Plot')
        .replace(/\bmilho safrinha\b/gi, 'second-crop corn')
        .replace(/\bsoja\b/gi, 'soy')
        .replace(/\bmilho\b/gi, 'corn')
        .replace(/\bbraqui[áa]ria\b/gi, 'brachiaria')
        .replace(/\bcrotal[áa]ria\b/gi, 'crotalaria')
        .replace(/\balgod[ãa]o\b/gi, 'cotton')
        .replace(/\bfeij[ãa]o\b/gi, 'beans')
        .replace(/\bsorgo\b/gi, 'sorghum')
        .replace(/\bmilheto\b/gi, 'millet')
        .replace(/\btrigo\b/gi, 'wheat')
        .replace(/\baveia\b/gi, 'oats')
        .replace(/\bpastagem\b/gi, 'pasture')
        .replace(/\bpousio\b/gi, 'fallow')
        .replace(/\bcom\b/gi, 'with')
        .replace(/\bágua\b/gi, 'water')
        .replace(/\bsolo\b/gi, 'soil')
        .replace(/\bclima\b/gi, 'climate')
        .replace(/\berosão\b/gi, 'erosion')
        .replace(/\boperação\b/gi, 'operation')
        .replace(/\bdiversidade\b/gi, 'diversity')
        .replace(/\bcobertura\b/gi, 'cover')
        .replace(/\beconômico\b/gi, 'economic')
        .replace(/Desempenho de/gi, 'Performance of')
        .replace(/Validar/gi, 'Validate')
        .replace(/nota/gi, 'score');
    }
    return txt;
  };

  const cancelarRequisicaoApi = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCarregandoApi(false);
  };

  const enviarParaApiReal = async (hectaresPoligonoOpcional = null) => {
    const coord = obterCoordenadaParaApi();

    const algumVerticeNaChina = pontosPoligono.some((p) =>
      isCoordenadaNaChina(p.latitude, p.longitude)
    );
    if (isCoordenadaNaChina(coord.latitude, coord.longitude) || algumVerticeNaChina) {
      exibirAlertaRestricaoChina();
      return;
    }

    const urlApi = "https://proximasafra-nasa-2026-01.azurewebsites.net/api/analyses";
    const nomeAreaFinal = cultivoEspecifico.trim() !== ""
      ? cultivoEspecifico.trim()
      : (idioma === 'pt' ? `Talhão ${historicoTalhoes.length + 1}` : `Plot ${historicoTalhoes.length + 1}`);

    const payload = {
      AreaName: nomeAreaFinal,
      Latitude: coord.latitude,
      Longitude: coord.longitude,
      HasIrrigation: temIrrigacao,
      Priority: prioridadeVisual,
      CycleCount: 1
    };

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    setCarregandoApi(true);

    try {
      const resposta = await fetch(urlApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const textoBruto = await resposta.text();

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}: ${textoBruto}`);
      }

      const dadosJson = JSON.parse(textoBruto);

      const hectaresFinal = hectaresPoligonoOpcional
        ? String(hectaresPoligonoOpcional)
        : areaPlantada;

      setResultadoApi(dadosJson);
      setEstrategiaSelecionadaIdx(0);
      setCarregandoApi(false);
      setTelaAtiva('analise');

      salvarNoHistoricoOffline({
        idLocal: dadosJson.id || String(Date.now()),
        dataHora: new Date().toLocaleString(idioma === 'pt' ? 'pt-BR' : 'en-US', {
          day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
        }),
        areaName: dadosJson.areaName || nomeAreaFinal,
        areaHectares: hectaresFinal,
        latitude: coord.latitude,
        longitude: coord.longitude,
        hasIrrigation: temIrrigacao,
        priority: prioridadeVisual,
        poligono: pontosPoligono,
        respostaApi: dadosJson
      });
    } catch (erro) {
      clearTimeout(timeoutId);
      setCarregandoApi(false);
      if (erro.name === 'AbortError') {
        Alert.alert(
          idioma === 'pt' ? "Tempo esgotado" : "Request Timeout",
          idioma === 'pt' ? "A análise foi cancelada ou demorou mais que o esperado. Tente novamente." : "The analysis was cancelled or took too long. Please try again."
        );
        return;
      }
      Alert.alert(
        idioma === 'pt' ? "Erro na API" : "API Error",
        `${idioma === 'pt' ? 'Não foi possível conectar:' : 'Could not connect:'} ${erro.message}`
      );
    }
  };

  const handleSalvarFormulario = () => {
    if (!areaTotal || !areaPlantada) {
      Alert.alert(idioma === 'pt' ? "Atenção" : "Attention", t.alertObrigatorio);
      return;
    }
    const totalNum = parseFloat(areaTotal.replace(',', '.'));
    const plantadaNum = parseFloat(areaPlantada.replace(',', '.'));
    if (plantadaNum > totalNum) {
      Alert.alert(idioma === 'pt' ? "Erro" : "Error", t.alertErroArea);
      return;
    }
    Keyboard.dismiss();
    enviarParaApiReal();
  };

  const handleConfirmarPoligono = () => {
    if (pontosPoligono.length < 3) {
      Alert.alert(
        idioma === 'pt' ? "Área incompleta" : "Incomplete area",
        idioma === 'pt' ? "Marque pelo menos 3 vértices." : "Mark at least 3 vertices."
      );
      return;
    }
    pararGravacaoPerimetro();

    const haCalc = calcularAreaHectares(pontosPoligono);
    if (haCalc > 0) {
      const haStr = String(haCalc);
      setAreaPlantada(haStr);
      const totalAtual = parseFloat((areaTotal || '0').replace(',', '.'));
      if (!areaTotal || isNaN(totalAtual) || totalAtual < haCalc) {
        setAreaTotal(haStr);
      }
    }

    enviarParaApiReal(haCalc);
  };

  const cw = resultadoApi?.currentWeather;

  const chaves7d = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];
  const barras7d = chaves7d.map((k) => {
    const v = cw?.rain07Days?.[k];
    return ehValorValidoNasa(v) ? Number(v.toFixed(1)) : null;
  });
  const total7d = barras7d
    .filter((v) => v !== null)
    .reduce((acc, v) => acc + v, 0);

  const chaves30d = ['week1', 'week2', 'week3', 'week4'];
  const barras30d = chaves30d.map((k) => {
    const v = cw?.rain30Days?.[k];
    return ehValorValidoNasa(v) ? Number(v.toFixed(1)) : null;
  });
  const total30d = barras30d
    .filter((v) => v !== null)
    .reduce((acc, v) => acc + v, 0);

  const tempValida = ehValorValidoNasa(cw?.temperature);
  const tempTexto = tempValida ? `${cw.temperature.toFixed(1)} °C` : t.indisponivelNasa;

  const umidadeValida = ehValorValidoNasa(cw?.soilMoisture);
  const umidadeValor = umidadeValida
    ? Math.min(100, Math.max(0, Number((cw.soilMoisture <= 1 ? cw.soilMoisture * 100 : cw.soilMoisture).toFixed(1))))
    : 0;
  const umidadeVolumetrica = umidadeValida
    ? (cw.soilMoisture <= 1 ? cw.soilMoisture : cw.soilMoisture / 100).toFixed(3)
    : null;
  const umidadeTexto = umidadeValida ? `${umidadeValor.toFixed(1)}%` : 'N/D';
  const umidadeStatus = !umidadeValida
    ? t.semLeituraSmap
    : umidadeValor < 15
      ? t.umidadeBaixa
      : umidadeValor <= 35
        ? t.umidadeIdeal
        : t.umidadeAlta;
  const umidadeCor = !umidadeValida
    ? '#64748B'
    : umidadeValor < 15
      ? '#B45309'
      : umidadeValor <= 35
        ? '#166534'
        : '#0369A1';

  const dadosClima = {
    '7d': {
      chuvaTotal: cw?.rain07Days ? `${total7d.toFixed(1)} mm` : '0.0 mm',
      barras: barras7d,
      labels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
    },
    '30d': {
      chuvaTotal: cw?.rain30Days ? `${total30d.toFixed(1)} mm` : '0.0 mm',
      barras: barras30d,
      labels: idioma === 'pt' ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'] : ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    }
  };

  const atual = dadosClima[periodo];
  const valoresValidosGrafico = atual.barras.filter((v) => v !== null && v > 0);
  const maiorBarra = valoresValidosGrafico.length > 0 ? Math.max(...valoresValidosGrafico) : 1;

  const estrategiasLista = Array.isArray(resultadoApi?.strategies) ? resultadoApi.strategies : [];
  const idxEstrategiaSegura =
    estrategiaSelecionadaIdx >= 0 && estrategiaSelecionadaIdx < estrategiasLista.length
      ? estrategiaSelecionadaIdx
      : 0;
  const estrategiaAtiva = estrategiasLista[idxEstrategiaSegura] || null;

  const handleCompartilharRelatorio = async () => {
    if (!resultadoApi || !estrategiaAtiva) return;
    const coord = obterCoordenadaParaApi();
    const nomeTalhao = traduzirTextoApi(resultadoApi.areaName || cultivoEspecifico || 'Talhão 01');
    const areaTxt = areaPlantada ? `${areaPlantada} ha` : (areaPoligonoHa > 0 ? `${areaPoligonoHa} ha` : '-');
    const nomeEstrategiaTraduzido = traduzirTextoApi(estrategiaAtiva.name);
    const umidadeRelatorio = umidadeValida ? `${umidadeTexto} (${umidadeVolumetrica} m³/m³)` : 'N/D';

    const criteriosLinhas = (estrategiaAtiva.criteria || [])
      .map((c) => `• ${formatarNomeCriterio(c.name)}: ${c.score}/100 (${t.pesoLabel} ${Math.round((c.weight || 0) * 100)}%)`)
      .join('\n');

    const vantagensLinhas = (estrategiaAtiva.positiveFactors || [])
      .map((f) => `✅ ${traduzirTextoApi(f)}`)
      .join('\n');

    const riscosLinhas = (estrategiaAtiva.risks || [])
      .map((r) => `⚠️ ${traduzirTextoApi(r)}`)
      .join('\n');

    const mensagem = idioma === 'pt'
      ? `🌱 *RASTER ROOT — Relatório Agronômico*\n\n` +
        `📍 *Talhão:* ${nomeTalhao}\n` +
        `📐 *Área:* ${areaTxt}\n` +
        `🛰️ *GPS:* ${coord.latitude}, ${coord.longitude}\n` +
        `💧 *Irrigação:* ${temIrrigacao ? 'Sim' : 'Não'}\n\n` +
        `🏆 *Estratégia Selecionada (Opção #${idxEstrategiaSegura + 1}):*\n` +
        `${nomeEstrategiaTraduzido}\n` +
        `• Pontuação Final: *${estrategiaAtiva.finalScore}/100*\n` +
        `• Viabilidade: *${formatarViabilidade(estrategiaAtiva.eligibility)}*\n` +
        `• Confiança do Modelo: *${estrategiaAtiva.confidence}%*\n\n` +
        `📊 *Critérios Avaliados:*\n${criteriosLinhas}\n\n` +
        (vantagensLinhas ? `*Pontos Fortes:*\n${vantagensLinhas}\n\n` : '') +
        (riscosLinhas ? `*Pontos de Atenção:*\n${riscosLinhas}\n\n` : '') +
        `🌦️ *Telemetria NASA:*\n` +
        `• Chuva 7 dias: ${dadosClima['7d'].chuvaTotal}\n` +
        `• Chuva 30 dias: ${dadosClima['30d'].chuvaTotal}\n` +
        `• Temperatura: ${tempTexto}\n` +
        `• Umidade do Solo: ${umidadeRelatorio}`
      : `🌱 *RASTER ROOT — Agronomic Report*\n\n` +
        `📍 *Plot:* ${nomeTalhao}\n` +
        `📐 *Area:* ${areaTxt}\n` +
        `🛰️ *GPS:* ${coord.latitude}, ${coord.longitude}\n` +
        `💧 *Irrigation:* ${temIrrigacao ? 'Yes' : 'No'}\n\n` +
        `🏆 *Selected Strategy (Option #${idxEstrategiaSegura + 1}):*\n` +
        `${nomeEstrategiaTraduzido}\n` +
        `• Final Score: *${estrategiaAtiva.finalScore}/100*\n` +
        `• Eligibility: *${formatarViabilidade(estrategiaAtiva.eligibility)}*\n` +
        `• Model Confidence: *${estrategiaAtiva.confidence}%*\n\n` +
        `📊 *Evaluated Criteria:*\n${criteriosLinhas}\n\n` +
        (vantagensLinhas ? `*Strengths:*\n${vantagensLinhas}\n\n` : '') +
        (riscosLinhas ? `*Attention Points:*\n${riscosLinhas}\n\n` : '') +
        `🌦️ *NASA Telemetry:*\n` +
        `• 7-day Rainfall: ${dadosClima['7d'].chuvaTotal}\n` +
        `• 30-day Rainfall: ${dadosClima['30d'].chuvaTotal}\n` +
        `• Temperature: ${tempTexto}\n` +
        `• Soil Moisture: ${umidadeRelatorio}`;

    try {
      await Share.share({ message: mensagem });
    } catch {}
  };

  const getCorFillCamada = () => {
    if (camadaAtiva === 'resumo') return 'rgba(56, 116, 37, 0.42)';
    if (camadaAtiva === 'temp') return 'rgba(217, 119, 6, 0.42)';
    return 'rgba(13, 105, 99, 0.42)';
  };

  const getBordaCamada = () => {
    if (camadaAtiva === 'resumo') return '#275320';
    if (camadaAtiva === 'temp') return '#B45309';
    return '#094268';
  };

  const isMesmoPoligonoAtivo = (poligonoSalvo) => {
    if (!Array.isArray(poligonoSalvo) || poligonoSalvo.length !== pontosPoligono.length) return false;
    if (poligonoSalvo.length === 0) return false;
    return (
      Math.abs(poligonoSalvo[0].latitude - pontosPoligono[0].latitude) < 0.00001 &&
      Math.abs(poligonoSalvo[0].longitude - pontosPoligono[0].longitude) < 0.00001
    );
  };

  const handleToqueTalhaoSalvoNoMapa = (item, centroItem) => {
    const nomeFmt = traduzirTextoApi(item.areaName);
    const areaFmt = item.areaHectares ? ` • ${item.areaHectares} ha` : '';
    Alert.alert(
      t.talhaoSalvoTitulo,
      `${nomeFmt}${areaFmt}\n${item.dataHora}`,
      [
        { text: t.fechar, style: 'cancel' },
        {
          text: t.centralizarMapa,
          onPress: () => focarCoordenadaNoMapa(centroItem.latitude, centroItem.longitude, 0.012)
        },
        {
          text: t.abrirAnalise,
          onPress: () => restaurarTalhaoDoHistorico(item, 'analise')
        }
      ]
    );
  };

  const coordAtualExibicao = obterCoordenadaParaApi();
  const centroPoligono = calcularCentroCoordenadas(pontosPoligono, {
    latitude: regiaoInicial.latitude,
    longitude: regiaoInicial.longitude,
  });
  const melhorScoreAtual = estrategiasLista.length > 0 ? estrategiasLista[0].finalScore : null;

  const opcoesPrioridade = [
    { id: 'Balanced', label: t.prioBalanced, ativo: true },
    { id: 'WaterConservation', label: t.prioWater, ativo: true },
    { id: 'SoilRecovery', label: t.prioSoil, ativo: true }
  ];

  const textoEtapaLoading =
    etapaLoading === 1 ? t.loadingEtapa1 : etapaLoading === 2 ? t.loadingEtapa2 : t.loadingEtapa3;

  if (mostrandoIntro) {
    return (
      <IntroVideoScreen
        onFinish={() => setMostrandoIntro(false)}
        labelPular={t.pularIntro}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />

      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTitle} numberOfLines={1} ellipsizeMode="tail">
              {t.appName}
            </Text>
            <Text style={styles.brandSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {telaAtiva === 'propriedade' ? t.subtitleProp : telaAtiva === 'analise' ? t.subtitleAnalise : t.subtitleMapa}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightRow}>
          <TouchableOpacity
            style={styles.historyHeaderBtn}
            onPress={() => setModalHistoricoVisivel(true)}
          >
            <Ionicons name="folder-open-outline" size={14} color="#094268" />
            <Text style={styles.historyHeaderText}>
              {t.btnHistorico} ({historicoTalhoes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.satIndicatorBtn}
            onPress={() => setModalSatelitesVisivel(true)}
          >
            <View style={[styles.pulseDot, statusGps !== 'ativo' && { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.satIndicatorText}>{statusGps === 'ativo' ? t.gpsAtivo : t.gpsBuscando}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.langButton}
            onPress={alternarIdiomaApp}
          >
            <Text style={styles.langButtonText}>{idioma === 'pt' ? 'EN' : 'PT'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LOADING OVERLAY */}
      {carregandoApi && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#275320" />
            <Text style={styles.loadingTitle}>{textoEtapaLoading}</Text>
            <TouchableOpacity style={styles.cancelLoadingBtn} onPress={cancelarRequisicaoApi}>
              <Text style={styles.cancelLoadingText}>{t.cancelar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL DE TELEMETRIA */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalSatelitesVisivel}
        onRequestClose={() => setModalSatelitesVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <MaterialCommunityIcons name="satellite-uplink" size={24} color="#275320" />
              <Text style={styles.modalTitle}>{t.modalSatTit}</Text>
            </View>
            <Text style={styles.modalSubtitle}>{t.modalSatSub}</Text>
            <View style={styles.satCardItem}>
              <Text style={styles.satName}>Lat: {coordAtualExibicao.latitude} | Lon: {coordAtualExibicao.longitude}</Text>
              {areaPoligonoHa > 0 && (
                <Text style={styles.satSubId}>{t.areaCalculadaBadge}: {areaPoligonoHa} ha</Text>
              )}
              {resultadoApi?.id && (
                <Text style={styles.satSubId}>ID Análise: {resultadoApi.id}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalSatelitesVisivel(false)}>
              <Text style={styles.modalCloseBtnText}>{t.fechar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE HISTÓRICO OFFLINE */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalHistoricoVisivel}
        onRequestClose={() => setModalHistoricoVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '78%' }]}>
            <View style={styles.modalHeaderRow}>
              <Ionicons name="layers" size={22} color="#094268" />
              <Text style={styles.modalTitle}>{t.modalHistTit}</Text>
            </View>
            <Text style={styles.modalSubtitle}>{t.modalHistSub}</Text>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {historicoTalhoes.length === 0 ? (
                <Text style={styles.emptyHistoryText}>{t.semHistorico}</Text>
              ) : (
                historicoTalhoes.map((item) => {
                  const topStrat = item.respostaApi?.strategies?.[0];
                  const temPoligono = Array.isArray(item.poligono) && item.poligono.length >= 3;
                  return (
                    <View key={item.idLocal} style={styles.historyCard}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => restaurarTalhaoDoHistorico(item, 'analise')}
                      >
                        <Text style={styles.historyCardTitle}>
                          {traduzirTextoApi(item.areaName)} {item.areaHectares ? `• ${item.areaHectares} ha` : ''}
                        </Text>
                        <Text style={styles.historyCardSub}>
                          {item.dataHora} • {temPoligono ? `${item.poligono.length} vértices` : `GPS: ${item.latitude}, ${item.longitude}`}
                        </Text>
                        {topStrat && (
                          <Text style={styles.historyCardScore}>
                            ⭐ {traduzirTextoApi(topStrat.name)} ({topStrat.finalScore}/100)
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.historyMapBtn}
                        onPress={() => restaurarTalhaoDoHistorico(item, 'mapa')}
                      >
                        <Ionicons name="map-outline" size={16} color="#094268" />
                        <Text style={styles.historyMapBtnText}>{t.verNoMapa}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.historyDeleteBtn}
                        onPress={() => removerDoHistoricoOffline(item.idLocal)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalHistoricoVisivel(false)}>
              <Text style={styles.modalCloseBtnText}>{t.fechar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ABA 1: QUESTIONÁRIO */}
      {telaAtiva === 'propriedade' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.introBox}>
              <View style={styles.introBadgeRow}>
                <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#275320" />
                <Text style={styles.introBadgeText}>GPS: {coordAtualExibicao.latitude}, {coordAtualExibicao.longitude}</Text>
              </View>
              <Text style={styles.introTitle}>{t.introTitle}</Text>
              <Text style={styles.introSubtitle}>{t.introSubtitle}</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.cardSectionTitle}>{t.sec1}</Text>

              {areaPoligonoHa > 0 && (
                <View style={styles.autoAreaBanner}>
                  <MaterialCommunityIcons name="vector-polygon" size={16} color="#166534" />
                  <Text style={styles.autoAreaText}>
                    {t.areaCalculadaBadge}: <Text style={{ fontWeight: 'bold' }}>{areaPoligonoHa} ha</Text>
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.labelAreaTotal}</Text>
                <TextInput style={styles.textInput} placeholder={t.phAreaTotal} keyboardType="numeric" value={areaTotal} onChangeText={setAreaTotal} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.labelAreaPlantada}</Text>
                <TextInput style={styles.textInput} placeholder={t.phAreaPlantada} keyboardType="numeric" value={areaPlantada} onChangeText={setAreaPlantada} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.labelAreaCriacao}</Text>
                <TextInput style={styles.textInput} placeholder={t.phAreaCriacao} keyboardType="numeric" value={areaCriacao} onChangeText={setAreaCriacao} />
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.cardSectionTitle}>{t.sec2}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.labelCultivo}</Text>
                <TextInput style={styles.textInput} placeholder={t.phCultivo} value={cultivoEspecifico} onChangeText={setCultivoEspecifico} />

                <Text style={styles.quickHelperLabel}>{t.atalhosCultura}</Text>
                <View style={styles.quickChipsWrap}>
                  {culturasRapidas[idioma].map((cult) => (
                    <TouchableOpacity
                      key={cult}
                      style={styles.quickChip}
                      onPress={() => {
                        const prefixo = idioma === 'pt' ? `Talhão ${historicoTalhoes.length + 1}` : `Plot ${historicoTalhoes.length + 1}`;
                        setCultivoEspecifico(`${prefixo} - ${cult}`);
                      }}
                    >
                      <Text style={styles.quickChipText}>+ {cult}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.label, { marginBottom: 0 }]}>{t.labelIrrigacao}</Text>
                <Switch value={temIrrigacao} onValueChange={setTemIrrigacao} trackColor={{ true: '#86EFAC' }} thumbColor={temIrrigacao ? '#275320' : '#F1F5F9'} />
              </View>

              <View style={[styles.inputGroup, { marginBottom: 4 }]}>
                <Text style={styles.label}>{t.labelPrioridade}</Text>
                <View style={styles.priorityRow}>
                  {opcoesPrioridade.map((item) => {
                    const desativado = !item.ativo;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={desativado ? 1 : 0.7}
                        style={[
                          styles.priorityChip,
                          prioridadeVisual === item.id && styles.priorityChipActive,
                          desativado && styles.priorityChipDisabled
                        ]}
                        onPress={() => {
                          if (!desativado) setPrioridadeVisual(item.id);
                        }}
                      >
                        <Text style={[
                          styles.priorityChipText,
                          prioridadeVisual === item.id && styles.priorityChipTextActive,
                          desativado && { color: '#64748B' }
                        ]}>
                          {item.label}
                        </Text>
                        {desativado && (
                          <Text style={styles.soonSubBadge}>{t.emBreve}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleSalvarFormulario}>
              <Text style={styles.actionButtonText}>{t.btnSalvar}</Text>
              <Ionicons name="cloud-upload-outline" size={20} color="#F7F7F7" />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : telaAtiva === 'analise' ? (
        /* ABA 2: ANÁLISES E ESTRATÉGIAS */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.farmSummaryStrip}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#275320" />
            <Text style={styles.farmSummaryText}>
              {idioma === 'pt' ? 'Talhão:' : 'Plot:'}{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {traduzirTextoApi(resultadoApi?.areaName || cultivoEspecifico || 'Planta 01')}
              </Text>
              {areaPlantada ? ` • ${areaPlantada} ha` : (areaPoligonoHa > 0 ? ` • ${areaPoligonoHa} ha` : '')}
              {resultadoApi?.priority ? ` • ${formatarPrioridade(resultadoApi.priority)}` : ''}
            </Text>
          </View>

          <View style={styles.bannerContainer}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=1000&auto=format&fit=crop' }} style={styles.bannerImage} resizeMode="cover" />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTag}>{t.climaTag}</Text>
              <Text style={styles.bannerTitle}>{t.apiRetornoTit}</Text>
            </View>
          </View>

          {estrategiasLista.length > 0 ? (
            <View style={styles.strategiesSection}>
              <Text style={styles.helperSubText}>{t.toqueDetalhes}</Text>

              {estrategiasLista.map((strat, index) => {
                const selecionada = idxEstrategiaSegura === index;
                return (
                  <TouchableOpacity
                    key={strat.strategyId || index}
                    activeOpacity={0.8}
                    onPress={() => setEstrategiaSelecionadaIdx(index)}
                    style={[
                      styles.strategyCard,
                      selecionada && styles.strategyCardSelected
                    ]}
                  >
                    <View style={styles.strategyHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons
                          name={selecionada ? "radio-button-on" : "radio-button-off"}
                          size={18}
                          color={selecionada ? "#275320" : "#64748B"}
                        />
                        <Text style={[styles.strategyNumber, selecionada && { color: '#275320' }]}>
                          {' '}{t.opcaoLabel} #{index + 1}
                        </Text>
                      </View>
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreText}>{t.scoreBadgeLabel}: {strat.finalScore}</Text>
                      </View>
                    </View>

                    <Text style={styles.strategyName}>{traduzirTextoApi(strat.name)}</Text>

                    <View style={styles.strategyFooter}>
                      <Text style={styles.eligibilityText}>
                        {t.elegibilidadeLabel}: <Text style={{ fontWeight: 'bold', color: '#166534' }}>{formatarViabilidade(strat.eligibility)}</Text>
                      </Text>
                      <Text style={styles.confidenceText}>
                        {t.confiancaLabel}: <Text style={{ fontWeight: 'bold' }}>{strat.confidence}%</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {estrategiaAtiva && (
                <View style={styles.strategyDetailBox}>
                  <View style={styles.detailHeader}>
                    <MaterialCommunityIcons name="chart-box-outline" size={22} color="#094268" />
                    <Text style={styles.detailTitle}>{t.indicadoresTitle} #{idxEstrategiaSegura + 1}</Text>
                  </View>
                  <Text style={styles.detailCropChain}>{traduzirTextoApi(estrategiaAtiva.name)}</Text>

                  <View style={styles.metricBarGroup}>
                    <View style={styles.metricLabelRow}>
                      <Text style={styles.metricLabel}>{t.scoreLabel}</Text>
                      <Text style={styles.metricValue}>{estrategiaAtiva.finalScore} / 100</Text>
                    </View>
                    <View style={styles.soilBarBackground}>
                      <View style={[styles.soilBarFill, { width: `${Math.min(100, Number(estrategiaAtiva.finalScore) || 0)}%`, backgroundColor: '#275320' }]} />
                    </View>
                  </View>

                  <View style={styles.metricBarGroup}>
                    <View style={styles.metricLabelRow}>
                      <Text style={styles.metricLabel}>{t.confiancaLabel}</Text>
                      <Text style={styles.metricValue}>{estrategiaAtiva.confidence}%</Text>
                    </View>
                    <View style={styles.soilBarBackground}>
                      <View style={[styles.soilBarFill, { width: `${Math.min(100, Number(estrategiaAtiva.confidence) || 0)}%`, backgroundColor: '#094268' }]} />
                    </View>
                  </View>

                  {estrategiaAtiva.criteria && estrategiaAtiva.criteria.length > 0 && (
                    <View style={styles.criteriaBox}>
                      <Text style={styles.compareChartTitle}>{t.criteriosTitle}</Text>
                      {estrategiaAtiva.criteria.map((crit, cIdx) => {
                        const nota = Number(crit.score) || 0;
                        const pesoPct = Math.round((Number(crit.weight) || 0) * 100);
                        const corBarra = nota >= 75 ? '#275320' : nota >= 55 ? '#D97706' : '#DC2626';
                        return (
                          <View key={cIdx} style={styles.criterionRow}>
                            <View style={styles.criterionLabelRow}>
                              <Text style={styles.criterionName}>
                                {formatarNomeCriterio(crit.name)}{' '}
                                <Text style={styles.criterionWeight}>({t.pesoLabel}: {pesoPct}%)</Text>
                              </Text>
                              <Text style={[styles.criterionScore, { color: corBarra }]}>{nota}/100</Text>
                            </View>
                            <View style={styles.criterionTrack}>
                              <View style={[styles.criterionFill, { width: `${Math.min(100, nota)}%`, backgroundColor: corBarra }]} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  <Text style={styles.compareChartTitle}>
                    {t.comparativoTitle} ({estrategiasLista.length})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={styles.barChartScrollContent}
                  >
                    {estrategiasLista.map((item, idx) => {
                      const val = Number(item.finalScore) || 0;
                      const isCurrent = idx === idxEstrategiaSegura;
                      return (
                        <TouchableOpacity
                          key={item.strategyId || idx}
                          style={[styles.barWrapperScroll, isCurrent && styles.barWrapperScrollActive]}
                          onPress={() => setEstrategiaSelecionadaIdx(idx)}
                        >
                          <Text style={[styles.barTopValue, isCurrent && styles.barTopValueActive]}>{val}</Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: `${Math.min(100, val)}%`,
                                  backgroundColor: isCurrent ? '#387425' : '#94A3B8'
                                }
                              ]}
                            />
                          </View>
                          <Text style={[styles.barLabel, isCurrent && styles.barLabelActive]} numberOfLines={1}>
                            {t.opcaoLabel} {idx + 1}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {estrategiaAtiva.positiveFactors && estrategiaAtiva.positiveFactors.length > 0 && (
                    <View style={[styles.tagsBlock, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name="checkmark-circle" size={16} color="#166534" style={{ marginRight: 4 }} />
                        <Text style={[styles.tagsBlockTitle, { color: '#166534', marginBottom: 0 }]}>{t.fatoresPositivosTitle}</Text>
                      </View>
                      {estrategiaAtiva.positiveFactors.map((f, i) => (
                        <Text key={i} style={styles.positiveItem}>• {traduzirTextoApi(f)}</Text>
                      ))}
                    </View>
                  )}

                  {estrategiaAtiva.risks && estrategiaAtiva.risks.length > 0 && (
                    <View style={[styles.tagsBlock, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7', marginTop: 10 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name="warning" size={16} color="#B45309" style={{ marginRight: 4 }} />
                        <Text style={[styles.tagsBlockTitle, { color: '#B45309', marginBottom: 0 }]}>{t.riscosTitle}</Text>
                      </View>
                      {estrategiaAtiva.risks.map((r, i) => (
                        <Text key={i} style={styles.riskItem}>• {traduzirTextoApi(r)}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyApiBox}>
              <Text style={styles.emptyApiSub}>{t.semEstrategia}</Text>
            </View>
          )}

          {/* CLIMA */}
          <Text style={styles.climateSectionHeading}>{t.climaTitulo}</Text>
          <View style={styles.filterContainer}>
            {[
              { id: '7d', label: t.f7d },
              { id: '30d', label: t.f30d }
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.filterButton, periodo === item.id && styles.filterButtonActive]}
                onPress={() => setPeriodo(item.id)}
              >
                <Text style={[styles.filterText, periodo === item.id && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.unifiedContainer}>
            {/* Card Chuva */}
            <View style={[styles.sectionBlock, { backgroundColor: '#F0F9FF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BAE6FD' }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.titleWithIcon}>
                  <Ionicons name="rainy" size={22} color="#0369A1" />
                  <Text style={[styles.sectionTitle, { color: '#0369A1' }]}>{t.chuvaTit}</Text>
                </View>
                <Text style={styles.nasaTag}>NASA GPM</Text>
              </View>
              <View style={styles.valueRow}>
                <Text style={[styles.mainMetric, { color: '#0369A1' }]}>{atual.chuvaTotal}</Text>
              </View>

              <View style={styles.rainChartContainer}>
                {atual.barras.map((valor, idx) => {
                  const semDado = valor === null;
                  const alturaPct = semDado ? 0 : Math.min(100, Math.round((valor / maiorBarra) * 100));
                  return (
                    <View key={idx} style={styles.barWrapper}>
                      <Text style={styles.rainBarValue} numberOfLines={1}>
                        {semDado ? 'N/D' : `${valor}`}
                      </Text>
                      <View style={styles.rainBarTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${alturaPct}%`,
                              backgroundColor: semDado ? '#CBD5E1' : '#0284C7'
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel} numberOfLines={1}>{atual.labels[idx]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 10 }} />

            {/* Card Temperatura */}
            <View style={[styles.sectionBlock, { backgroundColor: '#FFFBEB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FEF3C7' }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.titleWithIcon}>
                  <Ionicons name="thermometer" size={22} color="#B45309" />
                  <Text style={[styles.sectionTitle, { color: '#B45309' }]}>{t.tempTit}</Text>
                </View>
                <Text style={[styles.nasaTag, { backgroundColor: '#FEF3C7', color: '#B45309' }]}>NASA POWER</Text>
              </View>
              <View style={styles.valueRow}>
                <Text style={[styles.mainMetric, { color: tempValida ? '#B45309' : '#64748B', fontSize: tempValida ? 22 : 16 }]}>
                  {tempTexto}
                </Text>
              </View>
            </View>

            <View style={{ height: 10 }} />

            {/* Card Umidade do Solo */}
            <View style={[styles.sectionBlock, { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.titleWithIcon}>
                  <MaterialCommunityIcons name="water-percent" size={24} color={umidadeCor} />
                  <Text style={[styles.sectionTitle, { color: umidadeCor }]}>{t.soloTit}</Text>
                </View>
                <Text style={[styles.nasaTag, { backgroundColor: '#DCFCE7', color: '#166534' }]}>NASA SMAP</Text>
              </View>
              <View style={styles.valueRow}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={[styles.mainMetric, { color: umidadeCor }]}>
                    {umidadeTexto}
                  </Text>
                  {umidadeVolumetrica && (
                    <Text style={styles.volumetricSubText}>({umidadeVolumetrica} m³/m³)</Text>
                  )}
                </View>
                <Text style={[styles.statusGood, { color: umidadeCor }]}>
                  {umidadeStatus}
                </Text>
              </View>
              <View style={styles.soilBarBackground}>
                <View style={[styles.soilBarFill, { width: `${umidadeValor}%`, backgroundColor: umidadeCor }]} />
              </View>
            </View>
          </View>

          <View style={styles.postAnalysisRow}>
            {estrategiaAtiva && (
              <TouchableOpacity style={styles.shareButton} onPress={handleCompartilharRelatorio}>
                <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>{t.btnCompartilhar}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setTelaAtiva('propriedade')}>
              <Ionicons name="create-outline" size={20} color="#094268" />
              <Text style={styles.secondaryButtonText}>{t.btnEditar}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ABA 3: MAPA INTELIGENTE (GOOGLE MAPS) */
        <View style={styles.mapContainer}>
          <View style={styles.mapSearchBar}>
            <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.mapSearchInput}
              placeholder={t.phBuscaMapa}
              placeholderTextColor="#64748B"
              value={buscaMapa}
              onChangeText={setBuscaMapa}
              onSubmitEditing={handleBuscarLocalMapa}
              returnKeyType="search"
            />
            {buscaMapa.length > 0 && (
              <TouchableOpacity onPress={() => setBuscaMapa('')} style={{ paddingHorizontal: 4 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.mapSearchGoBtn} onPress={handleBuscarLocalMapa} disabled={buscandoLocal}>
              {buscandoLocal ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.mapLayersBar}>
            {[
              { id: 'resumo', label: t.camadaResumo },
              { id: 'temp', label: t.camadaTemp },
              { id: 'umidade', label: t.camadaUmidade }
            ].map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[styles.layerButton, camadaAtiva === layer.id && styles.layerButtonActive]}
                onPress={() => setCamadaAtiva(layer.id)}
              >
                <Text style={[styles.layerText, camadaAtiva === layer.id && styles.layerTextActive]}>{layer.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.mapHintPill}>
            <MaterialCommunityIcons name="vector-polygon" size={16} color="#061F3B" />
            <Text style={styles.mapHintText}>
              {pontosPoligono.length === 0
                ? t.dicaMapa
                : `${pontosPoligono.length} ${t.pontosMarcados}${areaPoligonoHa > 0 ? ` • ${areaPoligonoHa} ha` : ''} (${t.dicaArrastar})`}
            </Text>
          </View>

          {historicoTalhoes.length > 0 && (
            <TouchableOpacity
              style={[styles.savedPlotsToggleBtn, mostrarTalhoesSalvos && styles.savedPlotsToggleBtnActive]}
              onPress={() => setMostrarTalhoesSalvos((prev) => !prev)}
            >
              <Ionicons
                name={mostrarTalhoesSalvos ? 'eye' : 'eye-off-outline'}
                size={15}
                color={mostrarTalhoesSalvos ? '#FFFFFF' : '#094268'}
              />
              <Text style={[styles.savedPlotsToggleText, mostrarTalhoesSalvos && { color: '#FFFFFF' }]}>
                {t.btnSalvosMapa} ({historicoTalhoes.length})
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.walkPerimeterBtn, gravandoPerimetro && styles.walkPerimeterBtnActive]}
            onPress={alternarGravacaoPerimetro}
          >
            <MaterialCommunityIcons
              name={gravandoPerimetro ? 'stop-circle-outline' : 'walk'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.walkPerimeterText}>
              {gravandoPerimetro ? t.btnPararPerimetro : t.btnGravarPerimetro}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gpsCenterBtn} onPress={obterLocalizacaoReal}>
            <Ionicons name="locate" size={22} color="#061F3B" />
          </TouchableOpacity>

          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            mapType="hybrid"
            style={styles.mapView}
            initialRegion={regiaoInicial}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onPress={(evento) => {
              const coordToque = evento?.nativeEvent?.coordinate;
              if (!coordToque) return;
              if (isCoordenadaNaChina(coordToque.latitude, coordToque.longitude)) {
                exibirAlertaRestricaoChina();
                return;
              }
              setPontosPoligono((prev) => [...prev, coordToque]);
            }}
          >
            {/* POLÍGONO DE RESTRIÇÃO DA CHINA CONTINENTAL */}
            <Polygon
              coordinates={POLIGONO_CHINA}
              fillColor="rgba(220, 38, 38, 0.16)"
              strokeColor="#DC2626"
              strokeWidth={2}
            />

            {/* TALHÕES SALVOS OFFLINE */}
            {mostrarTalhoesSalvos && historicoTalhoes.map((item) => {
              const poligonoSalvo = Array.isArray(item.poligono) ? item.poligono : [];
              const temPoligonoValido = poligonoSalvo.length >= 3;

              if (temPoligonoValido && isMesmoPoligonoAtivo(poligonoSalvo)) {
                return null;
              }

              const pontoFallback = {
                latitude: Number(item.latitude),
                longitude: Number(item.longitude),
              };
              if (isNaN(pontoFallback.latitude) || isNaN(pontoFallback.longitude)) {
                return null;
              }

              const centroSalvo = temPoligonoValido
                ? calcularCentroCoordenadas(poligonoSalvo, pontoFallback)
                : pontoFallback;
              const topScore = item.respostaApi?.strategies?.[0]?.finalScore;
              const nomeSalvoFmt = traduzirTextoApi(item.areaName);

              return (
                <React.Fragment key={`saved-plot-${item.idLocal}`}>
                  {temPoligonoValido && (
                    <Polygon
                      coordinates={poligonoSalvo}
                      fillColor="rgba(9, 66, 104, 0.28)"
                      strokeColor="#38BDF8"
                      strokeWidth={2.5}
                      tappable={true}
                      onPress={() => handleToqueTalhaoSalvoNoMapa(item, centroSalvo)}
                    />
                  )}
                  <Marker
                    coordinate={centroSalvo}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onPress={() => handleToqueTalhaoSalvoNoMapa(item, centroSalvo)}
                  >
                    <View style={styles.savedPlotBadge}>
                      <Ionicons
                        name={temPoligonoValido ? 'bookmark' : 'location'}
                        size={12}
                        color="#FFFFFF"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.savedPlotBadgeText} numberOfLines={1}>
                        {nomeSalvoFmt}
                        {item.areaHectares ? ` • ${item.areaHectares} ha` : ''}
                        {topScore ? ` (${topScore})` : ''}
                      </Text>
                    </View>
                  </Marker>
                </React.Fragment>
              );
            })}

            {/* LINHA GUIA QUANDO HÁ APENAS 2 VÉRTICES */}
            {pontosPoligono.length === 2 && (
              <Polyline
                coordinates={pontosPoligono}
                strokeColor={getBordaCamada()}
                strokeWidth={3}
              />
            )}

            {/* POLÍGONO ATIVO EM EDIÇÃO */}
            {pontosPoligono.length >= 3 && (
              <Polygon
                coordinates={pontosPoligono}
                fillColor={getCorFillCamada()}
                strokeColor={getBordaCamada()}
                strokeWidth={3}
              />
            )}

            {/* VÉRTICES ARRASTÁVEIS DO POLÍGONO ATIVO */}
            {pontosPoligono.map((ponto, index) => (
              <Marker
                key={`vertex-${index}-${camadaAtiva}`}
                coordinate={ponto}
                draggable
                anchor={{ x: 0.5, y: 0.5 }}
                onDragEnd={(evento) => {
                  const novaCoord = evento?.nativeEvent?.coordinate;
                  if (!novaCoord) return;
                  if (isCoordenadaNaChina(novaCoord.latitude, novaCoord.longitude)) {
                    exibirAlertaRestricaoChina();
                    setPontosPoligono((prev) => [...prev]);
                    return;
                  }
                  setPontosPoligono((prev) =>
                    prev.map((item, idx) => (idx === index ? novaCoord : item))
                  );
                }}
              >
                <View style={[styles.vertexDot, { borderColor: getBordaCamada() }]}>
                  <Text style={styles.vertexText}>{index + 1}</Text>
                </View>
              </Marker>
            ))}

            {/* ETIQUETA CENTRAL DINÂMICA DO POLÍGONO ATIVO */}
            {pontosPoligono.length >= 3 && (
              <Marker
                coordinate={centroPoligono}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[
                  styles.dynamicBadgeMarker,
                  camadaAtiva === 'resumo' && { backgroundColor: '#166534' },
                  camadaAtiva === 'temp' && { backgroundColor: '#B45309' },
                  camadaAtiva === 'umidade' && { backgroundColor: '#0D6963' }
                ]}>
                  <MaterialCommunityIcons
                    name={camadaAtiva === 'resumo' ? 'vector-square' : camadaAtiva === 'temp' ? 'thermometer' : 'water-percent'}
                    size={14}
                    color="#FFFFFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.dynamicBadgeText}>
                    {camadaAtiva === 'resumo' && `${areaPoligonoHa} ha${melhorScoreAtual ? ` • Score: ${melhorScoreAtual}` : ''}`}
                    {camadaAtiva === 'temp' && `Temp: ${tempTexto}`}
                    {camadaAtiva === 'umidade' && `${idioma === 'pt' ? 'Umidade' : 'Moisture'}: ${umidadeTexto}`}
                  </Text>
                </View>
              </Marker>
            )}
          </MapView>

          {pontosPoligono.length > 0 && (
            <View style={styles.drawControlsContainer}>
              <TouchableOpacity style={styles.drawControlBtn} onPress={() => setPontosPoligono(pontosPoligono.slice(0, -1))}>
                <Ionicons name="arrow-undo" size={18} color="#061F3B" />
                <Text style={styles.drawControlText}>{t.btnDesfazer}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawControlBtn} onPress={() => setPontosPoligono([])}>
                <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                <Text style={[styles.drawControlText, { color: '#B91C1C' }]}>{t.btnLimpar}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawConfirmBtn} onPress={handleConfirmarPoligono}>
                <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                <Text style={styles.drawConfirmText}>{t.btnConfirmarArea}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* BARRA INFERIOR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setTelaAtiva('propriedade')}>
          <Ionicons name={telaAtiva === 'propriedade' ? 'document-text' : 'document-text-outline'} size={22} color={telaAtiva === 'propriedade' ? '#275320' : '#64748B'} />
          <Text style={[styles.navText, telaAtiva === 'propriedade' && styles.navTextActive]}>{t.navForm}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setTelaAtiva('analise')}>
          <Ionicons name={telaAtiva === 'analise' ? 'stats-chart' : 'stats-chart-outline'} size={22} color={telaAtiva === 'analise' ? '#275320' : '#64748B'} />
          <Text style={[styles.navText, telaAtiva === 'analise' && styles.navTextActive]}>{t.navAnalise}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setTelaAtiva('mapa')}>
          <Ionicons name={telaAtiva === 'mapa' ? 'map' : 'map-outline'} size={22} color={telaAtiva === 'mapa' ? '#275320' : '#64748B'} />
          <Text style={[styles.navText, telaAtiva === 'mapa' && styles.navTextActive]}>{t.navMapa}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0 },
  introVideoContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'flex-end' },
  introVideoFooter: { position: 'absolute', bottom: 38, left: 16, right: 16, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  skipIntroBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(6, 31, 59, 0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.35)' },
  skipIntroBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: 'bold', marginRight: 2 },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  brandContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  logoImage: { width: 34, height: 34, marginRight: 8, flexShrink: 0 },
  brandTextContainer: { flex: 1 },
  brandTitle: { color: '#061F3B', fontSize: 16, fontWeight: 'bold' },
  brandSubtitle: { color: '#0D6963', fontSize: 11, fontWeight: '600' },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  historyHeaderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  historyHeaderText: { fontSize: 11, fontWeight: 'bold', color: '#094268', marginLeft: 4 },
  satIndicatorBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  satIndicatorText: { fontSize: 11, fontWeight: 'bold', color: '#166534', marginLeft: 4 },
  langButton: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  langButtonText: { fontSize: 11, fontWeight: 'bold', color: '#061F3B' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6, 31, 59, 0.72)', zIndex: 99, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', width: '86%' },
  loadingTitle: { fontSize: 15, fontWeight: 'bold', color: '#061F3B', marginTop: 14, textAlign: 'center' },
  cancelLoadingBtn: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  cancelLoadingText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6, 31, 59, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: '#E2E8F0' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#061F3B', marginLeft: 8 },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  satCardItem: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  satName: { fontSize: 13, fontWeight: 'bold', color: '#061F3B' },
  satSubId: { fontSize: 11, color: '#475569', marginTop: 4 },
  emptyHistoryText: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingVertical: 20 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  historyCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#061F3B' },
  historyCardSub: { fontSize: 11, color: '#475569', marginTop: 2 },
  historyCardScore: { fontSize: 11.5, fontWeight: '600', color: '#166534', marginTop: 4 },
  historyMapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE', marginLeft: 6 },
  historyMapBtnText: { fontSize: 11, fontWeight: 'bold', color: '#094268', marginLeft: 4 },
  historyDeleteBtn: { padding: 8, marginLeft: 4 },
  modalCloseBtn: { backgroundColor: '#094268', borderRadius: 10, minHeight: 46, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  modalCloseBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 95 },
  introBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  introBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  introBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#275320', marginLeft: 6 },
  introTitle: { fontSize: 20, fontWeight: 'bold', color: '#061F3B', marginBottom: 4 },
  introSubtitle: { fontSize: 13, color: '#475569', lineHeight: 18 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#094268', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
  autoAreaBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 12 },
  autoAreaText: { fontSize: 12.5, color: '#166534', marginLeft: 6 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, minHeight: 48, fontSize: 14, color: '#061F3B' },
  quickHelperLabel: { fontSize: 11.5, fontWeight: '600', color: '#64748B', marginTop: 8, marginBottom: 6 },
  quickChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  quickChipText: { fontSize: 12, fontWeight: '600', color: '#094268' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', paddingHorizontal: 12, minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  priorityRow: { flexDirection: 'row', gap: 6 },
  priorityChip: { flex: 1, minHeight: 48, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  priorityChipActive: { backgroundColor: '#094268', borderColor: '#094268' },
  priorityChipDisabled: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  priorityChipText: { fontSize: 11.5, fontWeight: '700', color: '#334155', textAlign: 'center' },
  priorityChipTextActive: { color: '#FFFFFF' },
  soonSubBadge: { fontSize: 9.5, fontWeight: '700', color: '#94A3B8', marginTop: 2 },
  farmSummaryStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 12 },
  farmSummaryText: { fontSize: 12.5, color: '#275320', marginLeft: 8 },
  bannerContainer: { height: 110, borderRadius: 14, overflow: 'hidden', marginBottom: 14, backgroundColor: '#061F3B' },
  bannerImage: { width: '100%', height: '100%', opacity: 0.5 },
  bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  bannerTag: { color: '#F7F7F7', backgroundColor: '#275320', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  bannerTitle: { color: '#F7F7F7', fontSize: 16, fontWeight: 'bold' },
  strategiesSection: { marginBottom: 16 },
  helperSubText: { fontSize: 12, color: '#475569', marginBottom: 10, fontStyle: 'italic' },
  strategyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#E2E8F0' },
  strategyCardSelected: { borderColor: '#275320', backgroundColor: '#F0FDF4' },
  strategyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  strategyNumber: { fontSize: 12.5, fontWeight: 'bold', color: '#475569' },
  scoreBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  scoreText: { fontSize: 11.5, fontWeight: 'bold', color: '#166534' },
  strategyName: { fontSize: 14.5, fontWeight: 'bold', color: '#061F3B', marginBottom: 10 },
  strategyFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 },
  eligibilityText: { fontSize: 12, color: '#334155' },
  confidenceText: { fontSize: 12, color: '#334155' },
  strategyDetailBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginTop: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailTitle: { fontSize: 15, fontWeight: 'bold', color: '#094268', marginLeft: 8 },
  detailCropChain: { fontSize: 13.5, color: '#1E293B', fontWeight: '600', marginBottom: 14 },
  metricBarGroup: { marginBottom: 12 },
  metricLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metricLabel: { fontSize: 12.5, fontWeight: '600', color: '#334155' },
  metricValue: { fontSize: 12.5, fontWeight: 'bold', color: '#061F3B' },
  criteriaBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 4, marginBottom: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  criterionRow: { marginBottom: 8 },
  criterionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  criterionName: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  criterionWeight: { fontSize: 11, fontWeight: '400', color: '#64748B' },
  criterionScore: { fontSize: 12, fontWeight: 'bold' },
  criterionTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  criterionFill: { height: '100%', borderRadius: 3 },
  compareChartTitle: { fontSize: 13, fontWeight: 'bold', color: '#061F3B', marginTop: 6, marginBottom: 8 },
  tagsBlock: { marginTop: 6, padding: 12, borderRadius: 10, borderWidth: 1 },
  tagsBlockTitle: { fontSize: 12.5, fontWeight: 'bold', marginBottom: 4 },
  positiveItem: { fontSize: 12.5, color: '#166534', marginBottom: 3 },
  riskItem: { fontSize: 12.5, color: '#B45309', marginBottom: 3 },
  climateSectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#061F3B', marginTop: 8, marginBottom: 10 },
  filterContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: '#CBD5E1' },
  filterButton: { flex: 1, minHeight: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  filterButtonActive: { backgroundColor: '#094268' },
  filterText: { fontSize: 13, fontWeight: '700', color: '#061F3B' },
  filterTextActive: { color: '#F7F7F7' },
  unifiedContainer: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  sectionBlock: { paddingVertical: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  titleWithIcon: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  nasaTag: { fontSize: 10, fontWeight: 'bold', backgroundColor: '#E0F2FE', color: '#0369A1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 },
  mainMetric: { fontSize: 22, fontWeight: 'bold' },
  volumetricSubText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  statusGood: { fontSize: 11.5, fontWeight: 'bold', color: '#166534' },
  rainChartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 95, marginTop: 12, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#BAE6FD' },
  rainBarValue: { fontSize: 10.5, fontWeight: '700', color: '#0369A1', marginBottom: 4 },
  rainBarTrack: { width: 20, height: 50, backgroundColor: '#E0F2FE', borderRadius: 5, justifyContent: 'flex-end', overflow: 'hidden' },
  barChartScrollContent: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 10, paddingBottom: 8, paddingHorizontal: 2 },
  barWrapperScroll: { width: 68, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, borderRadius: 8, marginRight: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  barWrapperScrollActive: { backgroundColor: '#F0FDF4', borderColor: '#275320' },
  barWrapper: { flex: 1, alignItems: 'center' },
  barTopValue: { fontSize: 11.5, color: '#475569', marginBottom: 4 },
  barTopValueActive: { color: '#387425', fontWeight: 'bold' },
  barTrack: { width: 28, height: 65, backgroundColor: '#F1F5F9', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 11, color: '#475569', marginTop: 5, textAlign: 'center' },
  barLabelActive: { color: '#061F3B', fontWeight: 'bold' },
  soilBarBackground: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  soilBarFill: { height: '100%', backgroundColor: '#166534', borderRadius: 4 },
  emptyApiBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  emptyApiSub: { fontSize: 13.5, color: '#475569', textAlign: 'center' },
  actionButton: { backgroundColor: '#275320', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 52, borderRadius: 12, marginTop: 8 },
  actionButtonText: { color: '#F7F7F7', fontWeight: 'bold', fontSize: 15, marginRight: 8 },
  postAnalysisRow: { gap: 10, marginTop: 6 },
  shareButton: { backgroundColor: '#275320', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 50, borderRadius: 12 },
  shareButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14.5, marginLeft: 8 },
  secondaryButton: { backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#094268' },
  secondaryButtonText: { color: '#094268', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  mapContainer: { flex: 1 },
  mapView: { width: '100%', height: '100%' },
  mapSearchBar: { position: 'absolute', top: 10, left: 12, right: 12, zIndex: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingLeft: 10, paddingRight: 6, height: 44, borderWidth: 1, borderColor: '#CBD5E1', elevation: 4 },
  mapSearchInput: { flex: 1, fontSize: 13, color: '#061F3B' },
  mapSearchGoBtn: { backgroundColor: '#094268', width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  mapLayersBar: { position: 'absolute', top: 62, left: 12, right: 12, zIndex: 10, flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.96)', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#CBD5E1' },
  layerButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  layerButtonActive: { backgroundColor: '#061F3B' },
  layerText: { fontSize: 11.5, fontWeight: '700', color: '#334155' },
  layerTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  mapHintPill: { position: 'absolute', top: 112, alignSelf: 'center', zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1' },
  mapHintText: { fontSize: 11.5, fontWeight: '700', color: '#061F3B', marginLeft: 6 },
  savedPlotsToggleBtn: { position: 'absolute', top: 152, right: 12, zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.96)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1.5, borderColor: '#094268', elevation: 3 },
  savedPlotsToggleBtnActive: { backgroundColor: '#094268', borderColor: '#38BDF8' },
  savedPlotsToggleText: { fontSize: 11.5, fontWeight: 'bold', color: '#094268', marginLeft: 5 },
  savedPlotBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(9, 66, 104, 0.92)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, borderWidth: 1.5, borderColor: '#38BDF8', maxWidth: 210, elevation: 4 },
  savedPlotBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },
  walkPerimeterBtn: { position: 'absolute', left: 12, bottom: 84, zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#094268', paddingHorizontal: 14, height: 46, borderRadius: 23, elevation: 4 },
  walkPerimeterBtnActive: { backgroundColor: '#DC2626' },
  walkPerimeterText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: 'bold', marginLeft: 6 },
  gpsCenterBtn: { position: 'absolute', right: 14, bottom: 84, zIndex: 10, backgroundColor: '#FFFFFF', width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', elevation: 4 },
  vertexDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 3, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  vertexText: { fontSize: 11, fontWeight: 'bold', color: '#061F3B' },
  dynamicBadgeMarker: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  dynamicBadgeText: { fontSize: 11.5, fontWeight: 'bold', color: '#FFFFFF' },
  drawControlsContainer: { position: 'absolute', bottom: 14, left: 12, right: 12, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.96)', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', elevation: 4 },
  drawControlBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, minHeight: 42, borderRadius: 8, backgroundColor: '#F1F5F9' },
  drawControlText: { fontSize: 12.5, fontWeight: 'bold', color: '#061F3B', marginLeft: 4 },
  drawConfirmBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, minHeight: 42, borderRadius: 8, backgroundColor: '#275320' },
  drawConfirmText: { fontSize: 12.5, fontWeight: 'bold', color: '#FFFFFF', marginLeft: 4 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 10, justifyContent: 'space-around' },
  navItem: { alignItems: 'center', minWidth: 80 },
  navText: { fontSize: 11.5, color: '#64748B', marginTop: 3, fontWeight: '600' },
  navTextActive: { color: '#275320', fontWeight: 'bold' },
});