import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlantCodeLookupModal from '../components/PlantCodeLookupModal';
import {
  getSpecies,
  getSpeciesByCode,
  PlantCategory,
  PlantSpecies,
} from '../api/speciesApi';

const CATEGORIES: Array<PlantCategory | 'All'> = [
  'All',
  'Succulents',
  'Herbs',
  'Indoor',
  'Tropical',
];
const PAGE_SIZE = 10;

export default function PlantLibraryScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<PlantCategory | 'All'>('All');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ data: PlantSpecies[]; total: number }>({
    data: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [lookupVisible, setLookupVisible] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getSpecies({ search, category, page, pageSize: PAGE_SIZE })
      .then((response) => {
        if (active) setResult({ data: response.data, total: response.total });
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error ? requestError.message : 'Could not load the plant catalog.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, search, page, reloadKey]);

  const openSpecies = (species: PlantSpecies) => {
    router.push({ pathname: '/plant-species/[id]', params: { id: String(species.id) } });
  };

  const lookupCode = async (code: string) => {
    setLookupBusy(true);
    setLookupError(null);
    try {
      const species = await getSpeciesByCode(code);
      setLookupVisible(false);
      openSpecies(species);
    } catch (requestError) {
      setLookupError(
        requestError instanceof Error ? requestError.message : 'Could not look up that plant code.'
      );
    } finally {
      setLookupBusy(false);
    }
  };

  const renderSpecies = ({ item }: { item: PlantSpecies }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.82}
      onPress={() => openSpecies(item)}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name}`}
    >
      <View style={styles.cardIcon}>
        <Ionicons name="leaf" size={23} color="#1B5E34" />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </View>
        <Text style={styles.scientificName}>{item.scientificName}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.categoryBadge}>{item.category}</Text>
          <Text style={styles.plantCode}>{item.code}</Text>
        </View>
        <Text style={styles.thresholdSummary}>
          Moisture {item.minMoisture}-{item.maxMoisture}% · {item.minTempC}-{item.maxTempC}°C
        </Text>
      </View>
    </TouchableOpacity>
  );

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SPROUTFLOW · PLANT GUIDE</Text>
        <Text style={styles.title}>Plant Encyclopedia</Text>
        <Text style={styles.subtitle}>Find the right care ranges for every species.</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search common or scientific name"
            placeholderTextColor="#87938B"
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search plant species"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={19} color="#87938B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.toolbar}>
          <Text style={styles.resultCount}>{result.total} species</Text>
          <TouchableOpacity
            style={styles.lookupButton}
            onPress={() => {
              setLookupError(null);
              setLookupVisible(true);
            }}
          >
            <Ionicons name="qr-code-outline" size={17} color="#FFFFFF" />
            <Text style={styles.lookupButtonText}>Scan / code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryList}>
          {CATEGORIES.map((item) => {
            const selected = category === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setCategory(item);
                  setPage(1);
                }}
                style={[styles.categoryPill, selected && styles.categoryPillSelected]}
              >
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#1B5E34" />
            <Text style={styles.stateText}>Loading species…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Ionicons name="cloud-offline-outline" size={34} color="#B45309" />
            <Text style={styles.stateTitle}>Catalog unavailable</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setReloadKey((key) => key + 1)}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={result.data}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSpecies}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="leaf-outline" size={34} color="#94A3B8" />
                <Text style={styles.stateTitle}>No species found</Text>
                <Text style={styles.stateText}>Try another search or category.</Text>
              </View>
            }
            ListFooterComponent={
              result.total > PAGE_SIZE ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
                    disabled={page === 1}
                    onPress={() => setPage((current) => current - 1)}
                  >
                    <Text style={styles.pageButtonText}>Previous</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageIndicator}>
                    {page} / {totalPages}
                  </Text>
                  <TouchableOpacity
                    style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
                    disabled={page >= totalPages}
                    onPress={() => setPage((current) => current + 1)}
                  >
                    <Text style={styles.pageButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              ) : undefined
            }
          />
        )}
      </View>

      <PlantCodeLookupModal
        visible={lookupVisible}
        busy={lookupBusy}
        error={lookupError}
        onClose={() => setLookupVisible(false)}
        onLookup={lookupCode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  header: {
    backgroundColor: '#0F3D22',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  eyebrow: { color: '#A7F3D0', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 5 },
  subtitle: { color: '#D1FAE5', fontSize: 13, marginTop: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    paddingHorizontal: 12,
    minHeight: 46,
    marginTop: 17,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: '#17251C', fontSize: 14 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 13 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultCount: { color: '#52665A', fontWeight: '700', fontSize: 13 },
  lookupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1B5E34',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
  },
  lookupButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13, marginBottom: 12 },
  categoryPill: {
    borderRadius: 999,
    backgroundColor: '#E7ECE8',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  categoryPillSelected: { backgroundColor: '#D6F5E0' },
  categoryText: { color: '#536157', fontSize: 12, fontWeight: '700' },
  categoryTextSelected: { color: '#0F3D22' },
  listContent: { paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E8E2',
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#0F3D22', fontSize: 15, fontWeight: '800' },
  scientificName: { color: '#68766D', fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  categoryBadge: {
    color: '#1B5E34',
    backgroundColor: '#E8F5EC',
    borderRadius: 5,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '700',
  },
  plantCode: { color: '#718078', fontSize: 10, fontWeight: '700' },
  thresholdSummary: { color: '#52665A', fontSize: 11, marginTop: 7 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 9 },
  stateTitle: { color: '#26372C', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  stateText: { color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryButton: { backgroundColor: '#1B5E34', borderRadius: 9, paddingHorizontal: 17, paddingVertical: 10, marginTop: 5 },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', padding: 32, gap: 8 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingVertical: 6,
  },
  pageButton: { backgroundColor: '#E8F5EC', borderRadius: 8, paddingVertical: 9, paddingHorizontal: 13 },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: '#0F3D22', fontSize: 12, fontWeight: '700' },
  pageIndicator: { color: '#52665A', fontSize: 12, fontWeight: '700' },
});
