using System.IO;
using System.Text.Json;

namespace PetualangAir.Wpf.Services;

public enum BiomaType { SungaiGunung, HutanGambut, DanauVulkanik, KotaKanal, LautKarang, SamudraLepas }
public enum ResourceType { Coin, Trash, Fish, Pearl, Artifact, Dolphin, Storm }
public record Mission(string Id, BiomaType Bioma, string Title, string Description, ResourceType Resource, int Target, int Coins, int Reputation);
public record MarketItem(string Id, string Name, string Description, int Price, ResourceType? CostResource = null, int CostCount = 0, bool Unique = false);

public class GameStateService
{
    public static readonly string[] BiomeNames = ["Sungai Pegunungan", "Hutan Gambut", "Danau Vulkanik", "Perairan Kota", "Laut Karang", "Samudra Lepas"];
    public static readonly int[] RequiredLevels = [1, 1, 2, 2, 3, 4];
    public static readonly Mission[] Missions =
    [
        new("river-route", BiomaType.SungaiGunung, "Jejak pendayung", "Ambil 6 koin penanda jalur jeram.", ResourceType.Coin, 6, 100, 5),
        new("river-clean", BiomaType.SungaiGunung, "Hulu yang bersih", "Angkat 6 sampah dari sungai.", ResourceType.Trash, 6, 80, 15),
        new("swamp-fish", BiomaType.HutanGambut, "Bekal kampung", "Kumpulkan 5 ikan untuk pasar kampung.", ResourceType.Fish, 5, 120, 10),
        new("swamp-memory", BiomaType.HutanGambut, "Penjaga gambut", "Temukan artefak ukiran di antara bakau.", ResourceType.Artifact, 1, 100, 15),
        new("lake-memory", BiomaType.DanauVulkanik, "Cerita tepi danau", "Temukan 2 artefak budaya di danau.", ResourceType.Artifact, 2, 160, 15),
        new("lake-clean", BiomaType.DanauVulkanik, "Air untuk esok", "Bersihkan 8 sampah dari danau.", ResourceType.Trash, 8, 100, 15),
        new("city-clean", BiomaType.KotaKanal, "Sungai Lestari", "Angkat 12 sampah plastik dari kanal.", ResourceType.Trash, 12, 200, 30),
        new("city-memory", BiomaType.KotaKanal, "Kisah pasar terapung", "Temukan 2 artefak perdagangan sungai.", ResourceType.Artifact, 2, 140, 15),
        new("reef-pearl", BiomaType.LautKarang, "Mutiara Nusantara", "Kumpulkan 5 mutiara tanpa merusak karang.", ResourceType.Pearl, 5, 240, 15),
        new("reef-clean", BiomaType.LautKarang, "Rumah ikan", "Angkat 10 sampah di perairan karang.", ResourceType.Trash, 10, 180, 20),
        new("ocean-storm", BiomaType.SamudraLepas, "Penjelajah samudra", "Bertahan sampai satu badai berlalu di laut.", ResourceType.Storm, 1, 300, 20),
        new("ocean-friends", BiomaType.SamudraLepas, "Sahabat lumba-lumba", "Temui 3 lumba-lumba untuk bantuan dorongan.", ResourceType.Dolphin, 3, 200, 15)
    ];
    public static readonly MarketItem[] Market =
    [
        new("coconut", "Es Kelapa Muda", "Pulihkan 55 stamina. Dapat dibawa berlayar.", 25),
        new("coffee", "Kopi Tubruk", "Pulihkan 100 stamina.", 40, ResourceType.Fish, 1),
        new("repair", "Perbaikan bengkel", "Pulihkan seluruh ketahanan rakit.", 35),
        new("net", "Jaring pengumpul", "Jangkauan mengambil ikan, sampah, dan mutiara bertambah.", 90, ResourceType.Fish, 2, true),
        new("lamp", "Lampu petromaks", "Terangi kabut dan malam di hutan gambut.", 100, ResourceType.Trash, 4, true),
        new("bumper", "Bumper ban bekas", "Kurangi kerusakan tabrakan sebesar 40%.", 140, ResourceType.Trash, 6, true),
        new("compass", "Kompas angin", "Tampilkan arah angin, dermaga, dan koleksi terdekat.", 100, ResourceType.Fish, 3, true),
        new("batik", "Rompi Batik Lestari", "Kosmetik biru-emas; perlu reputasi 40.", 60, ResourceType.Pearl, 1, true)
    ];
    public static readonly string[] ArtifactStories =
    [
        "Dayung bambu: keterampilan membaca arus diwariskan lewat latihan bersama di sungai.",
        "Ukiran penjaga gambut: air dan hutan menjadi ruang hidup bersama yang perlu dirawat.",
        "Miniatur rumah adat: arsitektur tepian Danau Toba menginspirasi atap lengkung dalam ekspedisi ini.",
        "Timbangan pasar: pasar terapung mempertemukan hasil kebun dan tangkapan nelayan melalui barter.",
        "Liontin mutiara: perairan Raja Ampat menginspirasi warna karang dan kekayaan kehidupan laut.",
        "Miniatur pinisi: tradisi perahu Nusantara menginspirasi rakit terakhir Bang Jopi."
    ];
    private readonly string savePath;
    private readonly Dictionary<string, int> inventory = new();
    private readonly Dictionary<string, int> counters = new();
    private readonly HashSet<string> completed = new();
    private readonly HashSet<string> equipment = new();
    private readonly HashSet<int> journal = new();
    public int KoinNusantara { get; private set; } = 150;
    public int LevelRakit { get; private set; } = 1;
    public int KetahananRakit { get; private set; } = 100;
    public int StaminaJopi { get; private set; } = 100;
    public int Reputasi { get; private set; }
    public int UnlockedBiome { get; private set; }
    public int SungaiLestari => (int)Math.Min(100, counters.Where(x => x.Key.EndsWith(":Trash")).Sum(x => (long)x.Value) * 2);
    public bool IsDocked { get; private set; }
    public bool Muted { get; private set; }
    public double Volume { get; private set; } = 0.35;
    public string Quality { get; private set; } = "high";
    public int FieldOfView { get; private set; } = 58;
    public double Exposure { get; private set; } = 1.1;
    public double MusicVolume { get; private set; } = .65;
    public double EffectsVolume { get; private set; } = .8;
    public double CameraSensitivity { get; private set; } = 1;
    public bool ReducedMotion { get; private set; }
    public bool InvertY { get; private set; }
    public bool ShowHud { get; private set; } = true;
    public bool BatikAktif { get; private set; }
    public BiomaType BiomaAktif { get; private set; }
    public string StatusSimpan { get; private set; } = "Progres tersimpan otomatis";
    public IReadOnlySet<int> Journal => journal;
    public int CompletedCount => completed.Count;
    public bool ExpeditionComplete => completed.Count == Missions.Length;
    public event Action? OnStateChanged;

    public GameStateService() : this(Environment.GetEnvironmentVariable("PETUALANG_AIR_SAVE_PATH") ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "PetualangAir", "save.json")) { }
    public GameStateService(string path)
    {
        savePath = path;
        try
        {
            if (!File.Exists(path)) return;
            var data = JsonSerializer.Deserialize<SaveData>(File.ReadAllText(path));
            if (data is null) throw new JsonException("Empty save");
            KoinNusantara = Clamp(data.Koin);
            LevelRakit = Math.Clamp(data.Level, 1, 4);
            KetahananRakit = Math.Clamp(data.Ketahanan, 0, 100);
            StaminaJopi = Math.Clamp(data.Stamina, 0, 100);
            BiomaAktif = Enum.IsDefined(data.Bioma) ? data.Bioma : BiomaType.SungaiGunung;
            UnlockedBiome = Math.Clamp(data.Version < 2 ? (int)BiomaAktif : data.Unlocked, 0, 5);
            if ((int)BiomaAktif > UnlockedBiome) BiomaAktif = BiomaType.SungaiGunung;
            Reputasi = Math.Clamp(data.Reputation, 0, 1000);
            Volume = double.IsFinite(data.Volume) ? Math.Clamp(data.Volume, 0, 1) : 0.35;
            Muted = data.Muted;
            Quality = new[] { "low", "medium", "high", "ultra" }.Contains(data.Quality) ? data.Quality : "high";
            FieldOfView = Math.Clamp(data.FieldOfView, 45, 90);
            Exposure = double.IsFinite(data.Exposure) ? Math.Clamp(data.Exposure, .6, 1.6) : 1.1;
            MusicVolume = double.IsFinite(data.MusicVolume) ? Math.Clamp(data.MusicVolume, 0, 1) : .65;
            EffectsVolume = double.IsFinite(data.EffectsVolume) ? Math.Clamp(data.EffectsVolume, 0, 1) : .8;
            CameraSensitivity = double.IsFinite(data.CameraSensitivity) ? Math.Clamp(data.CameraSensitivity, .3, 2) : 1;
            ReducedMotion = data.ReducedMotion; InvertY = data.InvertY; ShowHud = data.ShowHud;
            foreach (var pair in data.Inventory ?? [])
                if (Enum.GetNames<ResourceType>().Contains(pair.Key) || pair.Key is "coconut" or "coffee") inventory[pair.Key] = Clamp(pair.Value);
            foreach (var pair in data.Counters ?? [])
                if (Enum.GetValues<BiomaType>().Any(b => Enum.GetNames<ResourceType>().Any(r => pair.Key == $"{b}:{r}"))) counters[pair.Key] = Clamp(pair.Value);
            completed.UnionWith((data.Completed ?? []).Where(id => Missions.Any(m => m.Id == id)));
            equipment.UnionWith((data.Equipment ?? []).Where(id => Market.Any(m => m.Unique && m.Id == id)));
            journal.UnionWith((data.Journal ?? []).Where(i => i >= 0 && i < 6));
            BatikAktif = data.Batik && Has("batik");
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or JsonException)
        {
            StatusSimpan = "Progres gagal dimuat; permainan memakai data awal.";
        }
    }
    public record SaveData(int Koin, int Level, int Ketahanan, BiomaType Bioma)
    {
        public int Version { get; init; }
        public int Stamina { get; init; } = 100;
        public int Unlocked { get; init; }
        public int Reputation { get; init; }
        public Dictionary<string, int>? Inventory { get; init; }
        public Dictionary<string, int>? Counters { get; init; }
        public string[]? Completed { get; init; }
        public string[]? Equipment { get; init; }
        public int[]? Journal { get; init; }
        public bool Batik { get; init; }
        public bool Muted { get; init; }
        public double Volume { get; init; } = 0.35;
        public string Quality { get; init; } = "high";
        public int FieldOfView { get; init; } = 58;
        public double Exposure { get; init; } = 1.1;
        public double MusicVolume { get; init; } = .65;
        public double EffectsVolume { get; init; } = .8;
        public double CameraSensitivity { get; init; } = 1;
        public bool ReducedMotion { get; init; }
        public bool InvertY { get; init; }
        public bool ShowHud { get; init; } = true;
    }
    private static int Clamp(int value) => Math.Clamp(value, 0, 1000000);
    public int Count(string key) => inventory.GetValueOrDefault(key);
    public bool Has(string id) => equipment.Contains(id);
    public bool IsCompleted(Mission mission) => completed.Contains(mission.Id);
    public int Progress(Mission mission) => Math.Min(mission.Target, counters.GetValueOrDefault($"{mission.Bioma}:{mission.Resource}"));
    public int Price(MarketItem item) => (int)Math.Ceiling(item.Price * (Reputasi >= 40 ? 0.8 : 1));
    public bool IsUnlocked(BiomaType biome) => Enum.IsDefined(biome) && (int)biome <= UnlockedBiome;
    public string UnlockRequirement(BiomaType biome) => $"Selesaikan misi utama {BiomeNames[Math.Max(0, (int)biome - 1)]} dan gunakan rakit level {RequiredLevels[(int)biome]}.";
    private void UpdateUnlocks()
    {
        while (UnlockedBiome < 5 && LevelRakit >= RequiredLevels[UnlockedBiome + 1] && completed.Contains(Missions.First(m => (int)m.Bioma == UnlockedBiome).Id)) UnlockedBiome++;
    }
    public string Collect(ResourceType resource)
    {
        if (!Enum.IsDefined(resource) || KetahananRakit == 0) return "";
        string key = $"{BiomaAktif}:{resource}";
        counters[key] = Clamp(counters.GetValueOrDefault(key) + 1);
        if (resource == ResourceType.Coin) KoinNusantara = Clamp(KoinNusantara + 25);
        else if (resource is ResourceType.Trash or ResourceType.Fish or ResourceType.Pearl or ResourceType.Artifact) inventory[resource.ToString()] = Clamp(Count(resource.ToString()) + 1);
        if (resource == ResourceType.Artifact) journal.Add((int)BiomaAktif);
        if (resource == ResourceType.Trash) Reputasi = Math.Min(1000, Reputasi + 1);
        var rewards = new List<string>();
        foreach (var mission in Missions.Where(m => m.Bioma == BiomaAktif && m.Resource == resource && !completed.Contains(m.Id) && Progress(m) >= m.Target))
        {
            completed.Add(mission.Id);
            KoinNusantara = Clamp(KoinNusantara + mission.Coins);
            Reputasi = Math.Min(1000, Reputasi + mission.Reputation);
            rewards.Add($"Misi {mission.Title} selesai! +{mission.Coins} koin");
        }
        int previous = UnlockedBiome;
        UpdateUnlocks();
        if (UnlockedBiome > previous) rewards.Add($"Bioma {BiomeNames[UnlockedBiome]} terbuka!");
        Changed();
        return string.Join(" | ", rewards);
    }
    public void SetDocked(bool docked) { IsDocked = docked; OnStateChanged?.Invoke(); }
    public bool Buy(string id)
    {
        var item = Market.FirstOrDefault(m => m.Id == id);
        if (!IsDocked || item is null || (item.Unique && Has(id)) || (id == "batik" && Reputasi < 40) || KoinNusantara < Price(item) || (item.CostResource is not null && Count(item.CostResource.ToString()!) < item.CostCount)) return false;
        KoinNusantara -= Price(item);
        if (item.CostResource is not null) inventory[item.CostResource.ToString()!] -= item.CostCount;
        if (item.Unique) equipment.Add(id);
        else if (id == "repair") KetahananRakit = 100;
        else inventory[id] = Clamp(Count(id) + 1);
        if (id == "batik") BatikAktif = true;
        Changed();
        return true;
    }
    public bool Sell(ResourceType resource)
    {
        int price = resource switch { ResourceType.Fish => 18, ResourceType.Trash => 8, ResourceType.Pearl => 45, _ => 0 };
        if (!IsDocked || price == 0 || Count(resource.ToString()) < 1) return false;
        inventory[resource.ToString()]--;
        KoinNusantara = Clamp(KoinNusantara + price);
        Changed();
        return true;
    }
    public bool UseDrink(string id)
    {
        if (id is not ("coconut" or "coffee") || Count(id) == 0 || StaminaJopi >= 100 || KetahananRakit == 0) return false;
        inventory[id]--;
        StaminaJopi = Math.Min(100, StaminaJopi + (id == "coffee" ? 100 : 55));
        Changed();
        return true;
    }
    public void ToggleBatik() { if (Has("batik")) { BatikAktif = !BatikAktif; Changed(); } }
    public void SetAudio(bool muted, double volume) { Muted = muted; Volume = double.IsFinite(volume) ? Math.Clamp(volume, 0, 1) : 0.35; Changed(); }
    public void SetStamina(int stamina) { StaminaJopi = Math.Clamp(stamina, 0, 100); OnStateChanged?.Invoke(); }
    public void PulihkanRakit() { KetahananRakit = 100; StaminaJopi = 100; Changed(); }
    public void TambahKoin(int jumlah) { KoinNusantara = (int)Math.Clamp((long)KoinNusantara + Math.Max(0, jumlah), 0, 1000000); Changed(); }
    public void KenaRintangan(int damage) { KetahananRakit = Math.Max(0, KetahananRakit - (int)Math.Ceiling(Math.Clamp(damage, 0, 100) * (Has("bumper") ? 0.6 : 1))); Changed(); }
    public bool UpgradeRakit()
    {
        int biaya = LevelRakit * 100;
        if (LevelRakit >= 4 || KoinNusantara < biaya) return false;
        KoinNusantara -= biaya;
        LevelRakit++;
        KetahananRakit = 100;
        UpdateUnlocks();
        Changed();
        return true;
    }
    public bool SetBioma(BiomaType bioma)
    {
        if (!IsUnlocked(bioma)) return false;
        BiomaAktif = bioma;
        IsDocked = false;
        Changed();
        return true;
    }
    public void SetOptions(string quality, int fieldOfView, double exposure, double music, double effects, double sensitivity, bool reducedMotion, bool invertY, bool showHud)
    {
        Quality = new[] { "low", "medium", "high", "ultra" }.Contains(quality) ? quality : "high";
        FieldOfView = Math.Clamp(fieldOfView, 45, 90); Exposure = double.IsFinite(exposure) ? Math.Clamp(exposure, .6, 1.6) : 1.1;
        MusicVolume = double.IsFinite(music) ? Math.Clamp(music, 0, 1) : .65; EffectsVolume = double.IsFinite(effects) ? Math.Clamp(effects, 0, 1) : .8;
        CameraSensitivity = double.IsFinite(sensitivity) ? Math.Clamp(sensitivity, .3, 2) : 1;
        ReducedMotion = reducedMotion; InvertY = invertY; ShowHud = showHud; Changed();
    }
    public bool NewExpedition()
    {
        // Preserve the previous expedition before replacing it; options remain unchanged.
        try { if (File.Exists(savePath)) File.Copy(savePath, savePath + ".previous", true); }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException) { StatusSimpan = "Cadangan gagal dibuat. Ekspedisi lama tetap aktif."; OnStateChanged?.Invoke(); return false; }
        inventory.Clear(); counters.Clear(); completed.Clear(); equipment.Clear(); journal.Clear();
        KoinNusantara = 150; LevelRakit = 1; KetahananRakit = 100; StaminaJopi = 100;
        Reputasi = 0; UnlockedBiome = 0; BiomaAktif = BiomaType.SungaiGunung; BatikAktif = false; IsDocked = true; Changed(); return true;
    }
    public void Save() => Changed();
    private void Changed()
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(savePath))!);
            var data = new SaveData(KoinNusantara, LevelRakit, KetahananRakit, BiomaAktif)
            {
                Version = 2, Stamina = StaminaJopi, Unlocked = UnlockedBiome, Reputation = Reputasi,
                Inventory = inventory, Counters = counters, Completed = completed.ToArray(), Equipment = equipment.ToArray(),
                Journal = journal.ToArray(), Batik = BatikAktif, Muted = Muted, Volume = Volume,
                Quality = Quality, FieldOfView = FieldOfView, Exposure = Exposure, MusicVolume = MusicVolume, EffectsVolume = EffectsVolume,
                CameraSensitivity = CameraSensitivity, ReducedMotion = ReducedMotion, InvertY = InvertY, ShowHud = ShowHud
            };
            File.WriteAllText(savePath + ".tmp", JsonSerializer.Serialize(data));
            File.Move(savePath + ".tmp", savePath, true);
            StatusSimpan = "Progres tersimpan otomatis";
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException) { StatusSimpan = "Progres gagal disimpan. Periksa akses folder penyimpanan."; }
        OnStateChanged?.Invoke();
    }
}
