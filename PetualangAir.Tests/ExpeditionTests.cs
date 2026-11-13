using PetualangAir.Wpf.Services;
using System.Text.Json;
namespace PetualangAir.Tests;

public class ExpeditionTests : IDisposable
{
    private readonly string directory = Path.Combine(Path.GetTempPath(), "PetualangAirTests", Guid.NewGuid().ToString());
    private string SavePath => Path.Combine(directory, "save.json");
    private static void Collect(GameStateService state, ResourceType type, int count) { for (int i = 0; i < count; i++) state.Collect(type); }
    [Fact]
    public void MissionReward_IsGrantedExactlyOnce_AndUnlocksNextBiome()
    {
        var state = new GameStateService(SavePath);
        Assert.False(state.SetBioma(BiomaType.HutanGambut));
        Collect(state, ResourceType.Coin, 5);
        Assert.Equal(0, state.CompletedCount);
        state.Collect(ResourceType.Coin);
        Assert.Equal(400, state.KoinNusantara);
        Assert.Equal(1, state.CompletedCount);
        Assert.True(state.SetBioma(BiomaType.HutanGambut));
        state.SetBioma(BiomaType.SungaiGunung);
        Collect(state, ResourceType.Coin, 6);
        Assert.Equal(550, state.KoinNusantara);
        Assert.Equal(1, state.CompletedCount);
    }
    [Fact]
    public void FullCampaign_CanFinishWithoutDebugGrants_AndPersists()
    {
        var state = new GameStateService(SavePath);
        foreach (var biome in Enum.GetValues<BiomaType>())
        {
            while (state.LevelRakit < GameStateService.RequiredLevels[(int)biome]) Assert.True(state.UpgradeRakit());
            Assert.True(state.SetBioma(biome));
            foreach (var mission in GameStateService.Missions.Where(m => m.Bioma == biome)) Collect(state, mission.Resource, mission.Target);
        }
        Assert.True(state.ExpeditionComplete);
        Assert.Equal(12, state.CompletedCount);
        Assert.Equal(5, state.UnlockedBiome);
        var loaded = new GameStateService(SavePath);
        Assert.True(loaded.ExpeditionComplete);
        Assert.Equal(state.Reputasi, loaded.Reputasi);
        Assert.Equal(state.Count("Trash"), loaded.Count("Trash"));
        Assert.Equal(state.Journal.Order(), loaded.Journal.Order());
    }
    [Fact]
    public void Barter_RequiresDockCoinsAndMaterials_AndUniquePurchasesDoNotRepeat()
    {
        var state = new GameStateService(SavePath);
        Collect(state, ResourceType.Fish, 2);
        Assert.False(state.Buy("net"));
        state.SetDocked(true);
        Assert.True(state.Buy("net"));
        Assert.Equal(60, state.KoinNusantara);
        Assert.Equal(0, state.Count("Fish"));
        Assert.True(state.Has("net"));
        Assert.False(state.Buy("net"));
        Assert.False(state.Buy("lamp"));
        Assert.False(state.Buy("invalid"));
        Assert.Equal(60, state.KoinNusantara);
    }
    [Fact]
    public void Reputation_UnlocksDiscountAndBatik_TrashSaleDoesNotUndoMissionProgress()
    {
        var state = new GameStateService(SavePath);
        state.SetDocked(true);
        Assert.False(state.Buy("batik"));
        Collect(state, ResourceType.Trash, 30);
        var lamp = GameStateService.Market.Single(m => m.Id == "lamp");
        Assert.Equal(80, state.Price(lamp));
        Assert.Equal(60, state.SungaiLestari);
        Assert.True(state.Sell(ResourceType.Trash));
        Assert.Equal(60, state.SungaiLestari);
        state.Collect(ResourceType.Pearl);
        Assert.True(state.Buy("batik"));
        Assert.True(state.BatikAktif);
        state.ToggleBatik();
        Assert.False(state.BatikAktif);
    }
    [Fact]
    public void BumperReducesDamage_ConsumablesAreNotSpentAtFullStamina()
    {
        var state = new GameStateService(SavePath);
        state.SetDocked(true);
        Collect(state, ResourceType.Trash, 6);
        Assert.True(state.Buy("bumper"));
        state.KenaRintangan(10);
        Assert.Equal(94, state.KetahananRakit);
        Assert.True(state.Buy("coconut"));
        Assert.False(state.UseDrink("coconut"));
        Assert.Equal(1, state.Count("coconut"));
        state.SetStamina(20);
        Assert.True(state.UseDrink("coconut"));
        Assert.Equal(75, state.StaminaJopi);
        Assert.False(state.UseDrink("coconut"));
        Assert.False(state.UseDrink("invalid"));
    }
    [Fact]
    public void VersionOneSave_MigratesWithoutRemovingAlreadyVisitedBiome()
    {
        Directory.CreateDirectory(directory);
        File.WriteAllText(SavePath, """{"Koin":321,"Level":3,"Ketahanan":70,"Bioma":4}""");
        var state = new GameStateService(SavePath);
        Assert.True(state.IsUnlocked(BiomaType.LautKarang));
        Assert.Equal(321, state.KoinNusantara);
        Assert.Equal(100, state.StaminaJopi);
        state.Save();
        Assert.Equal(2, JsonDocument.Parse(File.ReadAllText(SavePath)).RootElement.GetProperty("Version").GetInt32());
    }
    [Fact]
    public void AccessoriesInventoryAudioAndJournal_RoundTrip()
    {
        var state = new GameStateService(SavePath);
        Collect(state, ResourceType.Fish, 2); state.SetDocked(true);
        Assert.True(state.Buy("net")); Assert.True(state.Buy("coconut"));
        state.Collect(ResourceType.Artifact); state.SetStamina(34); state.SetAudio(true, .7);
        var loaded = new GameStateService(SavePath);
        Assert.True(loaded.Has("net")); Assert.Equal(1, loaded.Count("coconut"));
        Assert.Contains(0, loaded.Journal); Assert.True(loaded.Muted); Assert.Equal(.7, loaded.Volume);
        Assert.Equal(34, loaded.StaminaJopi); Assert.False(loaded.IsDocked);
    }
    [Fact]
    public void FailedSaleAndLockedTravel_DoNotChangeState()
    {
        var state = new GameStateService(SavePath); state.SetDocked(true);
        Assert.False(state.Sell(ResourceType.Pearl)); Assert.False(state.Sell(ResourceType.Artifact));
        Assert.False(state.SetBioma(BiomaType.SamudraLepas)); Assert.Equal(BiomaType.SungaiGunung, state.BiomaAktif);
        Assert.Equal(150, state.KoinNusantara);
    }
    [Fact]
    public void UnwritableSavePath_ReportsFailureWithoutCrashingGameplay()
    {
        Directory.CreateDirectory(directory);
        File.WriteAllText(Path.Combine(directory, "not-a-directory"), "x");
        var state = new GameStateService(Path.Combine(directory, "not-a-directory", "save.json"));
        state.Collect(ResourceType.Coin);
        Assert.Equal(175, state.KoinNusantara);
        Assert.Contains("gagal disimpan", state.StatusSimpan);
    }
    public void Dispose() { if (Directory.Exists(directory)) Directory.Delete(directory, true); }
}
